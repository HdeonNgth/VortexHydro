-- ============================================================================
-- Migration 004: Tabel Telemetri IoT & Perangkat ESP32 (Siap Pakai di Supabase)
-- ============================================================================
-- Skema ini disiapkan agar perangkat ESP32 Vortex Hydro dapat mengirim data
-- sensor baik ke server lokal (SQLite) maupun ke Supabase PostgreSQL (Cloud).

create table if not exists public.esp_devices (
  device_id        text primary key,
  label            text not null default 'ESP32 Vortex Node',
  firmware_version text not null default '1.0.0',
  ip_address       text,
  rssi             integer,
  uptime_sec       integer,
  last_seen_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index if not exists idx_esp_devices_last_seen
  on public.esp_devices (last_seen_at desc);

create table if not exists public.esp_readings (
  id         bigint generated always as identity primary key,
  device_id  text not null references public.esp_devices(device_id) on delete cascade,
  recorded_at timestamptz not null default now(),
  debit      double precision not null check (debit >= 0 and debit <= 1000),
  head       double precision not null check (head >= 0 and head <= 100),
  rpm        double precision not null check (rpm >= 0 and rpm <= 10000),
  volt       double precision not null check (volt >= 0 and volt <= 1000),
  amp        double precision not null check (amp >= 0 and amp <= 1000),
  daya       double precision not null check (daya >= 0 and daya <= 1000000),
  eff        double precision not null check (eff >= 0 and eff <= 100),
  temp       double precision not null check (temp >= -20 and temp <= 150),
  rssi       integer
);

create index if not exists idx_esp_readings_device_time
  on public.esp_readings (device_id, recorded_at desc);

create index if not exists idx_esp_readings_time
  on public.esp_readings (recorded_at desc);

-- Row Level Security: default terkunci. Hanya Edge Function (service_role)
-- atau Admin terverifikasi yang boleh membaca data telemetri ESP32.
alter table public.esp_devices enable row level security;
alter table public.esp_readings enable row level security;

revoke all on public.esp_devices from anon, authenticated;
revoke all on public.esp_readings from anon, authenticated;
