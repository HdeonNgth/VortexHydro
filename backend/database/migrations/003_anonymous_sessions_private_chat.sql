-- Vortex Hydro: Private Anonymous Sessions for Public AI Chat + Admin Monitoring
-- Additive migration on existing public.conversations & public.messages (no duplicate tables)

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz null default (now() + interval '90 days'),
  constraint chat_sessions_token_hash_len check (char_length(token_hash) = 64)
);

create index if not exists chat_sessions_last_activity_idx
  on public.chat_sessions (last_activity_at desc);

alter table public.chat_sessions enable row level security;
revoke all on public.chat_sessions from anon, authenticated;

alter table public.conversations
  add column if not exists session_id uuid null references public.chat_sessions(id) on delete cascade;

create index if not exists conversations_session_id_updated_idx
  on public.conversations (session_id, updated_at desc)
  where session_id is not null;

alter table public.messages
  add column if not exists session_id uuid null references public.chat_sessions(id) on delete cascade;

create index if not exists messages_session_id_created_idx
  on public.messages (session_id, created_at desc)
  where session_id is not null;

-- Keep direct anon table access strictly revoked
revoke all on public.conversations from anon;
revoke all on public.messages from anon;
