-- Create wishlist table
create table if not exists public.wishlist (
  id uuid not null default gen_random_uuid(),
  traveler_id uuid not null references public.travelers(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  constraint wishlist_pkey primary key (id),
  constraint wishlist_traveler_id_package_id_key unique (traveler_id, package_id)
);

-- Enable RLS
alter table public.wishlist enable row level security;

-- Policies
create policy "Users can view their own wishlist"
  on public.wishlist for select
  using (auth.uid() = traveler_id);

create policy "Users can insert into their own wishlist"
  on public.wishlist for insert
  with check (auth.uid() = traveler_id);

create policy "Users can delete from their own wishlist"
  on public.wishlist for delete
  using (auth.uid() = traveler_id);
