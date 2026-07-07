-- Direct messages between travelers and agencies. The frontend hook
-- (src/features/agency/hooks/useAgencyMessages.ts) already queries this table
-- and subscribes to realtime INSERTs; the table never existed in the schema.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_messages_sender on public.messages (sender_id, created_at desc);
create index idx_messages_recipient on public.messages (recipient_id, created_at desc);

alter table public.messages enable row level security;

-- Participants can read their conversations.
create policy "Participants can view their messages"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Senders can only send as themselves.
create policy "Users can send messages as themselves"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Recipients can mark messages read (the only update the app performs).
create policy "Recipients can mark messages read"
  on public.messages for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- The agency inbox listens for INSERTs via postgres_changes.
alter publication supabase_realtime add table public.messages;
