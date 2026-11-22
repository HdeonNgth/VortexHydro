-- Vortex Hydro: Private AI Chat (Auth + RLS) & Admin AI Monitoring Dashboard
-- Additive, non-destructive migration on existing public.conversations & public.messages

alter table public.conversations
  alter column session_token_hash drop not null;

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc)
  where user_id is not null;

create index if not exists conversations_created_at_idx
  on public.conversations (created_at desc);

alter table public.messages
  add column if not exists user_id uuid null references auth.users(id) on delete cascade;

update public.messages m
set user_id = c.user_id
from public.conversations c
where m.conversation_id = c.id
  and m.user_id is null
  and c.user_id is not null;

create index if not exists messages_user_created_idx
  on public.messages (user_id, created_at desc)
  where user_id is not null;

create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;

create policy "user_roles_select_own"
  on public.user_roles
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (char_length(action) <= 64),
  target_conversation_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_idx
  on public.admin_audit_logs (admin_user_id, created_at desc);

alter table public.admin_audit_logs enable row level security;
revoke all on public.admin_audit_logs from anon, authenticated;

alter table public.conversations enable row level security;
revoke all on public.conversations from anon, authenticated;
grant select, insert, update, delete on public.conversations to authenticated;

create policy "conversations_select_own"
  on public.conversations
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "conversations_insert_own"
  on public.conversations
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "conversations_update_own"
  on public.conversations
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "conversations_delete_own"
  on public.conversations
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select, insert, update, delete on public.messages to authenticated;

create policy "messages_select_own"
  on public.messages
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "messages_insert_own"
  on public.messages
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "messages_update_own"
  on public.messages
  for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "messages_delete_own"
  on public.messages
  for delete
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create or replace function public.vh_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute function public.vh_touch_updated_at();

create trigger user_roles_touch_updated_at
  before update on public.user_roles
  for each row execute function public.vh_touch_updated_at();
