-- Wave 3 (audit AGY-31, AGY-8 gap, AGY-33, AGY-35 — docs/audits/agency-portal-audit-2026-07-18.md).
-- (a) agency_activity_logs: agency-side audit trail mirroring the admin
--     pattern — the agency inserts its own rows, agencies read only their own,
--     admins read all. (b) client_errors: fire-and-forget error reports from
--     the ErrorBoundary. (c) payments: the owning agency can see the payment
--     ledger for bookings on its packages (previously traveler+admin only).
-- (d) reviews FK indexes. (e) travel_agencies own-update WITH CHECK symmetry.

-- (a) agency activity log
create table public.agency_activity_logs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  action_description text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_agency_activity_logs_agency on public.agency_activity_logs (agency_id, created_at desc);

alter table public.agency_activity_logs enable row level security;

create policy "Agencies insert their own activity"
  on public.agency_activity_logs for insert to authenticated
  with check ((select auth.uid()) = agency_id);

create policy "Agencies view their own activity"
  on public.agency_activity_logs for select to authenticated
  using ((select auth.uid()) = agency_id or public.has_role((select auth.uid()), 'admin'));

-- (b) client error reports (insert-only for authenticated users; admins read)
create table public.client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  stack text,
  path text,
  created_at timestamptz not null default now()
);

alter table public.client_errors enable row level security;

create policy "Users report their own errors"
  on public.client_errors for insert to authenticated
  with check (user_id is null or (select auth.uid()) = user_id);

create policy "Admins view client errors"
  on public.client_errors for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

-- (c) agency payments visibility
create policy "Agencies view payments for their bookings"
  on public.payments for select to authenticated
  using (exists (
    select 1
    from public.package_bookings b
    join public.packages p on p.id = b.package_id
    where b.id = booking_id and p.agency_id = (select auth.uid())
  ));

-- (d) reviews FK indexes (AGY-35; update_package_rating aggregates by package_id)
create index if not exists idx_reviews_package_id on public.reviews(package_id);
create index if not exists idx_reviews_traveler_id on public.reviews(traveler_id);

-- (e) WITH CHECK symmetry (AGY-33; sensitive columns stay trigger-guarded)
drop policy if exists "Agencies can update their own profile" on public.travel_agencies;
create policy "Agencies can update their own profile"
  on public.travel_agencies for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
