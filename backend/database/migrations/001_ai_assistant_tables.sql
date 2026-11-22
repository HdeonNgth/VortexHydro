create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null,
  user_id uuid null references auth.users(id) on delete set null,
  title text not null default 'Percakapan baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_hash_len check (char_length(session_token_hash) = 64),
  constraint conversations_title_len check (char_length(title) <= 120)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now(),
  model text null,
  status text not null default 'completed' check (status in ('pending','completed','error')),
  constraint messages_content_len check (char_length(content) <= 20000)
);

create index if not exists conversations_session_updated_idx
  on public.conversations (session_token_hash, updated_at desc);
create index if not exists conversations_user_idx
  on public.conversations (user_id) where user_id is not null;
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Tanpa policy untuk anon/authenticated: akses langsung ditolak.
-- Semua operasi lewat Edge Function (service role melewati RLS).
revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;
