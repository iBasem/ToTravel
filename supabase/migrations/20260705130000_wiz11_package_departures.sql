-- WIZ-11: Real departures/availability, replacing the client-side faked
-- availability (useAvailability generated random seats + discounts because no
-- departures table existed). This adds a real table; seats-remaining is derived
-- from bookings at read time (no denormalized counter to drift).

create table if not exists public.package_departures (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  departure_date date not null,
  return_date date,
  total_seats integer not null default 1 check (total_seats > 0),
  price_override numeric(10,2) check (price_override is null or price_override >= 0),
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (package_id, departure_date)
);

create index if not exists idx_package_departures_package_id on public.package_departures(package_id);
create index if not exists idx_package_departures_date on public.package_departures(departure_date);

alter table public.package_departures enable row level security;

drop policy if exists "Anyone can view departures" on public.package_departures;
create policy "Anyone can view departures"
  on public.package_departures for select using (true);

drop policy if exists "Agencies manage own departures" on public.package_departures;
create policy "Agencies manage own departures"
  on public.package_departures for all to authenticated
  using (exists (select 1 from public.packages p where p.id = package_id and p.agency_id = (select auth.uid())))
  with check (exists (select 1 from public.packages p where p.id = package_id and p.agency_id = (select auth.uid())));

drop policy if exists "Admins manage all departures" on public.package_departures;
create policy "Admins manage all departures"
  on public.package_departures for all to authenticated
  using (public.has_role((select auth.uid()),'admin'))
  with check (public.has_role((select auth.uid()),'admin'));

drop trigger if exists update_package_departures_updated_at on public.package_departures;
create trigger update_package_departures_updated_at
  before update on public.package_departures
  for each row execute function public.update_updated_at_column();

-- Seed real departures for existing published packages (weekly, weeks 2..17),
-- so the availability UI shows genuine bookable dates instead of fabricated ones.
insert into public.package_departures (package_id, departure_date, return_date, total_seats)
select p.id,
       (current_date + (7 * gs))::date,
       (current_date + (7 * gs) + coalesce(p.duration_days, 1))::date,
       coalesce(p.max_participants, 10)
from public.packages p
cross join generate_series(2, 17) as gs
where p.status = 'published'
on conflict (package_id, departure_date) do nothing;
