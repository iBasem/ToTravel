-- 1) platform_settings: persists the AdminSettings page values that were
--    hardcoded useState defaults (auto-approve, email notifications,
--    maintenance mode, platform commission). Single-row table.

create table public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  commission_rate numeric not null default 0.12 check (commission_rate >= 0 and commission_rate <= 1),
  auto_approve_agencies boolean not null default false,
  email_notifications boolean not null default true,
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.platform_settings enable row level security;

create policy "Admins can view platform settings"
  on public.platform_settings for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update platform settings"
  on public.platform_settings for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.platform_settings (id) values (1);

-- 2) agency_public_stats: real numbers behind the OperatorInfo card, which
--    previously displayed hardcoded "50+ Tours / 5+ Years Exp. / 1K+ Travelers".
--    SECURITY DEFINER because anonymous visitors can see package detail pages
--    but cannot read package_bookings; the function exposes only aggregate
--    counts for a single agency — no row data, no PII.

create or replace function public.agency_public_stats(agency_uuid uuid)
returns table (
  tours_count integer,
  years_experience integer,
  travelers_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer
       from public.packages p
      where p.agency_id = agency_uuid
        and p.status = 'published'),
    (select greatest(1, extract(year from age(now(), a.created_at))::integer)
       from public.travel_agencies a
      where a.id = agency_uuid),
    (select coalesce(sum(b.participants), 0)::integer
       from public.package_bookings b
       join public.packages p on p.id = b.package_id
      where p.agency_id = agency_uuid
        and coalesce(b.status, 'pending') in ('confirmed', 'completed'));
$$;

revoke all on function public.agency_public_stats(uuid) from public;
grant execute on function public.agency_public_stats(uuid) to anon, authenticated;

-- 3) package_region_stats: real region distribution for the admin reports
--    pie chart, replacing the hardcoded destination-keyword taxonomy and the
--    25/25/25/25 empty-state fallback in useAdminReports. security_invoker:
--    admins can read all packages; others only aggregate published ones.

create view public.package_region_stats
  with (security_invoker = true) as
select
  region_key,
  count(*)::integer as package_count
from (
  select distinct on (p.id)
    p.id,
    coalesce(d.region_keys[1], 'others') as region_key
  from public.packages p
  left join public.destinations d
    on d.kind = 'country'
   and (
     p.destination ilike '%' || d.name || '%'
     or (d.name_ar is not null and p.destination_ar ilike '%' || d.name_ar || '%')
   )
  order by p.id, d.display_order
) x
group by region_key;

grant select on public.package_region_stats to anon, authenticated;
