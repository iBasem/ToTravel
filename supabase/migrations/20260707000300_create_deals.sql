-- Agency promotional deals. The frontend hook
-- (src/features/agency/hooks/useAgencyDeals.ts) already performs CRUD against
-- this table; it never existed in the schema.

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.travel_agencies(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  title text not null,
  discount_percentage numeric not null check (discount_percentage > 0 and discount_percentage <= 90),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  status text not null default 'active' check (status in ('active', 'scheduled', 'expired', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_deals_agency on public.deals (agency_id, created_at desc);

alter table public.deals enable row level security;

create policy "Agencies can view their own deals"
  on public.deals for select
  to authenticated
  using (auth.uid() = agency_id);

create policy "Admins can view all deals"
  on public.deals for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Agencies can create their own deals"
  on public.deals for insert
  to authenticated
  with check (auth.uid() = agency_id);

create policy "Agencies can update their own deals"
  on public.deals for update
  to authenticated
  using (auth.uid() = agency_id)
  with check (auth.uid() = agency_id);

create policy "Agencies can delete their own deals"
  on public.deals for delete
  to authenticated
  using (auth.uid() = agency_id);

create trigger update_deals_updated_at
  before update on public.deals
  for each row execute function public.update_updated_at_column();
