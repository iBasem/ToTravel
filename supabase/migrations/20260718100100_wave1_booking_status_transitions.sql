-- Wave 1 (audit AGY-5 — docs/audits/agency-portal-audit-2026-07-18.md).
--
-- sec2 pinned every booking field except `status` for the owning agency, but
-- left the status VALUE unconstrained: an agency could set an unpaid pending
-- booking straight to 'completed', which unlocks create-review's completed
-- gate (review fraud) and desyncs workflow state from payment state.
-- Constrain the owning agency to an explicit transition map:
--   pending   → confirmed | cancelled
--   confirmed → cancelled
--   confirmed → completed   (only when the booking is paid)
-- Admins and service-role connections keep full latitude (unchanged).

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

    -- ...and only along the allowed transition map.
    if new.status is distinct from old.status then
      if not (
        (old.status = 'pending'   and new.status in ('confirmed','cancelled')) or
        (old.status = 'confirmed' and new.status = 'cancelled') or
        (old.status = 'confirmed' and new.status = 'completed' and old.payment_status = 'paid')
      ) then
        raise exception 'Invalid booking status transition: % -> % (completed requires a paid booking)', old.status, new.status
          using errcode = '42501';
      end if;
    end if;

    return new;
  end if;

  -- Anyone else is not permitted to update bookings.
  raise exception 'Not authorized to modify this booking'
    using errcode = '42501';
end;
$$;

revoke execute on function public.enforce_booking_update_guard() from anon, authenticated;
