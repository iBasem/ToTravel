-- SEC-2: Prevent travelers from rewriting their own booking's price, status,
-- or payment fields; restrict agencies to changing only the workflow status.
--
-- 1) Drop the over-broad "Travelers can update their own bookings" policy.
--    Travelers have no legitimate booking-update flow today (verified: no
--    client code updates package_bookings as a traveler), and the policy
--    allowed setting total_price=1 / payment_status='paid' / status='completed'
--    (the last also unlocked review fraud via create-review's completed check).
--
-- 2) Add a BEFORE UPDATE guard so that even the owning agency may change only
--    `status` (and updated_at). Admins and service-role/backend connections
--    (e.g. the future payment webhook) bypass the guard.

drop policy if exists "Travelers can update their own bookings" on public.package_bookings;

create or replace function public.enforce_booking_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Backend / service-role connections (e.g. payment webhook) bypass the guard.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  -- Admins may change anything.
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  -- The owning agency may change ONLY the workflow status.
  if exists (
    select 1 from public.packages p
    where p.id = new.package_id and p.agency_id = auth.uid()
  ) then
    if new.total_price       is distinct from old.total_price
    or new.payment_status    is distinct from old.payment_status
    or new.payment_method    is distinct from old.payment_method
    or new.payment_reference is distinct from old.payment_reference
    or new.traveler_id       is distinct from old.traveler_id
    or new.package_id        is distinct from old.package_id
    or new.participants      is distinct from old.participants
    or new.booking_date      is distinct from old.booking_date
    or new.special_requests  is distinct from old.special_requests then
      raise exception 'Agencies may only update booking status'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- Anyone else is not permitted to update bookings.
  raise exception 'Not authorized to modify this booking'
    using errcode = '42501';
end;
$$;

revoke execute on function public.enforce_booking_update_guard() from anon, authenticated;

drop trigger if exists trg_enforce_booking_update_guard on public.package_bookings;
create trigger trg_enforce_booking_update_guard
  before update on public.package_bookings
  for each row execute function public.enforce_booking_update_guard();
