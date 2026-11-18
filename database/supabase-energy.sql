-- Vortex Hydro: pelacakan energi (PLN masuk ke pompa vs listrik yang dihasilkan generator)
-- Aman dijalankan ulang. Sudah diterapkan ke project "vortex-hydro" (Supabase).
-- Penjelasan lengkap: database/README-supabase.md, bagian "Energi, efisiensi, dan laporan".

-- 1. Kolom baru pada pembacaan terbaru (satu baris, id = 'live')
alter table public.live_telemetry
  add column if not exists pln_in_w  numeric not null default 0,  -- daya listrik PLN yang masuk ke pompa (W)
  add column if not exists gen_out_w numeric not null default 0,  -- daya listrik yang dihasilkan generator (W)
  add column if not exists bess_soc  numeric not null default 0,  -- isi baterai BESS (%)
  add column if not exists op_s      numeric not null default 0,  -- total waktu operasi terakumulasi (detik, dihitung server)
  add column if not exists e_in_wh   numeric not null default 0,  -- total energi PLN masuk (Wh)
  add column if not exists e_out_wh  numeric not null default 0;  -- total energi dihasilkan (Wh)

-- 2. Status internal penghitung (tidak terekspos API)
create table if not exists private.telemetry_state (
  id            integer primary key default 1 check (id = 1),
  last_sim_op_s numeric,
  bkt_idx       bigint  not null default 0,
  bkt_dt_s      numeric not null default 0,
  bkt_in_wh     numeric not null default 0,
  bkt_out_wh    numeric not null default 0,
  bkt_in_peak   numeric not null default 0,
  bkt_out_peak  numeric not null default 0
);
alter table private.telemetry_state enable row level security;
insert into private.telemetry_state (id) values (1) on conflict (id) do nothing;

-- 3. Riwayat: satu baris per menit operasi (energi dan puncak daya pada menit itu)
create table if not exists public.telemetry_log (
  id          bigint generated always as identity primary key,
  op_s        numeric not null,   -- waktu operasi kumulatif saat baris ditulis (detik)
  ts          bigint  not null,   -- jam server, milidetik sejak 1970
  dt_s        numeric not null,   -- panjang interval baris ini (detik operasi)
  in_wh       numeric not null,   -- energi PLN masuk pada interval ini (Wh)
  out_wh      numeric not null,   -- energi dihasilkan pada interval ini (Wh)
  in_peak_w   numeric not null,   -- puncak daya PLN pada interval ini (W)
  out_peak_w  numeric not null,   -- puncak daya generator pada interval ini (W)
  debit       numeric,
  vbat        numeric,
  rpm_shaft   numeric,
  rpm_gen     numeric,
  bess_soc    numeric
);
create index if not exists telemetry_log_op_s_idx on public.telemetry_log (op_s);
alter table public.telemetry_log enable row level security;
drop policy if exists "telemetry_log dapat dibaca semua" on public.telemetry_log;
create policy "telemetry_log dapat dibaca semua" on public.telemetry_log
  for select to anon, authenticated using (true);

-- 4. Satu-satunya jalan menulis: tetap dilindungi kunci simulator
drop function if exists public.push_telemetry(text, numeric, numeric, numeric, numeric);
create or replace function public.push_telemetry(
  p_key text, p_debit numeric, p_vbat numeric, p_rpm_shaft numeric, p_rpm_gen numeric,
  p_in_w numeric default 0, p_out_w numeric default 0, p_soc numeric default 0, p_op_s numeric default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  st       private.telemetry_state%rowtype;
  lv       public.live_telemetry%rowtype;
  v_now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_dt     numeric;
  v_in_wh  numeric;
  v_out_wh numeric;
  v_op     numeric;
  v_b      bigint;
begin
  if p_key is null or p_key <> (select secret from private.sim_secret where id = 1) then
    raise exception 'kunci simulator salah' using errcode = '42501';
  end if;

  if p_debit is null or p_vbat is null or p_rpm_shaft is null or p_rpm_gen is null
     or p_in_w is null or p_out_w is null or p_soc is null
     or p_debit not between 0 and 100
     or p_vbat not between 0 and 60
     or p_rpm_shaft not between 0 and 5000
     or p_rpm_gen not between 0 and 20000
     or p_in_w not between 0 and 20000
     or p_out_w not between 0 and 5000
     or p_soc not between 0 and 100
     or (p_op_s is not null and p_op_s < 0) then
    raise exception 'nilai di luar rentang wajar' using errcode = '22003';
  end if;

  select * into st from private.telemetry_state where id = 1 for update;
  select * into lv from public.live_telemetry where id = 'live' for update;

  -- Selisih waktu operasi sejak pengiriman sebelumnya. Jam operasi dari simulasi (sudah termasuk
  -- percepatan waktu). Bila simulasi di-reset atau dimuat ulang, hitungan dilanjutkan tanpa lompatan.
  if p_op_s is not null then
    v_dt := case when st.last_sim_op_s is null or p_op_s < st.last_sim_op_s then 0
                 else least(p_op_s - st.last_sim_op_s, 900) end;
    st.last_sim_op_s := p_op_s;
  else
    v_dt := least(greatest((v_now_ms - lv.ts) / 1000.0, 0), 5);
    st.last_sim_op_s := null;
  end if;

  v_in_wh  := p_in_w  * v_dt / 3600.0;
  v_out_wh := p_out_w * v_dt / 3600.0;
  v_op     := lv.op_s + v_dt;

  st.bkt_dt_s     := st.bkt_dt_s + v_dt;
  st.bkt_in_wh    := st.bkt_in_wh + v_in_wh;
  st.bkt_out_wh   := st.bkt_out_wh + v_out_wh;
  st.bkt_in_peak  := greatest(st.bkt_in_peak, p_in_w);
  st.bkt_out_peak := greatest(st.bkt_out_peak, p_out_w);

  v_b := floor(v_op / 60)::bigint;
  if v_b > st.bkt_idx and st.bkt_dt_s > 0 then
    insert into public.telemetry_log
      (op_s, ts, dt_s, in_wh, out_wh, in_peak_w, out_peak_w, debit, vbat, rpm_shaft, rpm_gen, bess_soc)
    values
      (v_op, v_now_ms, st.bkt_dt_s, st.bkt_in_wh, st.bkt_out_wh, st.bkt_in_peak, st.bkt_out_peak,
       p_debit, p_vbat, p_rpm_shaft, p_rpm_gen, p_soc);
    st.bkt_dt_s := 0; st.bkt_in_wh := 0; st.bkt_out_wh := 0; st.bkt_in_peak := 0; st.bkt_out_peak := 0;
  end if;
  st.bkt_idx := v_b;

  update private.telemetry_state
     set last_sim_op_s = st.last_sim_op_s, bkt_idx = st.bkt_idx, bkt_dt_s = st.bkt_dt_s,
         bkt_in_wh = st.bkt_in_wh, bkt_out_wh = st.bkt_out_wh,
         bkt_in_peak = st.bkt_in_peak, bkt_out_peak = st.bkt_out_peak
   where id = 1;

  update public.live_telemetry
     set debit = p_debit, vbat = p_vbat, rpm_shaft = p_rpm_shaft, rpm_gen = p_rpm_gen,
         pln_in_w = p_in_w, gen_out_w = p_out_w, bess_soc = p_soc,
         op_s = v_op, e_in_wh = e_in_wh + v_in_wh, e_out_wh = e_out_wh + v_out_wh,
         ts = v_now_ms, updated_at = now()
   where id = 'live';
end;
$$;

-- 5. Mulai uji baru: nol-kan total energi, jam operasi, dan hapus riwayat. Butuh kunci simulator.
create or replace function public.reset_telemetry(p_key text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_key is null or p_key <> (select secret from private.sim_secret where id = 1) then
    raise exception 'kunci simulator salah' using errcode = '42501';
  end if;
  delete from public.telemetry_log where id is not null;
  update private.telemetry_state
     set last_sim_op_s = null, bkt_idx = 0, bkt_dt_s = 0, bkt_in_wh = 0, bkt_out_wh = 0,
         bkt_in_peak = 0, bkt_out_peak = 0
   where id = 1;
  update public.live_telemetry
     set pln_in_w = 0, gen_out_w = 0, op_s = 0, e_in_wh = 0, e_out_wh = 0
   where id = 'live';
end;
$$;

-- 6. Ringkasan per jendela jam operasi (bawaan 5 jam): rata-rata, puncak, energi, efisiensi
--    eff_pct = efisiensi rata-rata (energi keluar / energi masuk), eff_peak_pct dan eff_min_pct =
--    efisiensi tertinggi dan terendah per menit operasi di jendela itu.
drop function if exists public.report_windows(integer, integer);
create or replace function public.report_windows(p_hours integer default 5, p_limit integer default 12)
returns table (
  win_idx integer, covered_s numeric, e_in_wh numeric, e_out_wh numeric,
  in_avg_w numeric, out_avg_w numeric, in_peak_w numeric, out_peak_w numeric,
  eff_pct numeric, eff_peak_pct numeric, eff_min_pct numeric
)
language sql stable security invoker set search_path = ''
as $$
  select t.w, t.cov, t.s_in, t.s_out,
         case when t.cov > 0 then t.s_in  * 3600 / t.cov else 0 end,
         case when t.cov > 0 then t.s_out * 3600 / t.cov else 0 end,
         t.pk_in, t.pk_out,
         case when t.s_in > 0 then t.s_out / t.s_in * 100 else 0 end,
         coalesce(t.eff_pk, 0), coalesce(t.eff_mn, 0)
    from (
      select floor(l.op_s / (greatest(p_hours, 1) * 3600.0))::integer as w,
             sum(l.dt_s) as cov, sum(l.in_wh) as s_in, sum(l.out_wh) as s_out,
             max(l.in_peak_w) as pk_in, max(l.out_peak_w) as pk_out,
             max(case when l.in_wh > 0 then l.out_wh / l.in_wh * 100 end) as eff_pk,
             min(case when l.in_wh > 0 then l.out_wh / l.in_wh * 100 end) as eff_mn
        from public.telemetry_log l
       group by 1
    ) t
   order by t.w desc
   limit greatest(least(p_limit, 200), 1);
$$;
