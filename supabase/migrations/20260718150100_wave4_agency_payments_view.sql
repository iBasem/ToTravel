-- Wave 4 (REG-8): the wave-3 agency SELECT policy on `payments` was
-- column-unrestricted, so a raw REST `select=raw` returned the stored Moyasar
-- webhook payload (payer details) for the agency's bookings. Replace it with
-- a definer-style view exposing only display columns, scoped internally to
-- the caller's own packages. Travelers/admins keep their base-table policies.
-- (Also clears the multiple-permissive-policies advisor WARN on payments.)

drop policy if exists "Agencies view payments for their bookings" on public.payments;

create or replace view public.agency_payments as
select
  p.id,
  p.booking_id,
  p.amount,
  p.currency,
  p.status,
  p.created_at,
  pk.title  as package_title,
  trim(coalesce(t.first_name, '') || ' ' || coalesce(t.last_name, '')) as traveler_name
from public.payments p
join public.package_bookings b on b.id = p.booking_id
join public.packages pk on pk.id = b.package_id
left join public.travelers t on t.id = b.traveler_id
where pk.agency_id = (select auth.uid());

grant select on public.agency_payments to authenticated;
revoke all on public.agency_payments from anon;
