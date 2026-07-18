-- Wave 2 (audit AGY-17/18/19, deals rejected dead-end, booking decline —
-- docs/audits/agency-portal-audit-2026-07-18.md). Three workflow-integrity
-- changes:
--
-- (a) package_departures: the only delete guard was client-side while the
--     bookings FK is ON DELETE SET NULL — deleting a departure silently
--     detached its bookings back to free-date capacity. BEFORE DELETE trigger
--     rejects deletion while active bookings reference the departure.
-- (b) deals.rejection_reason: admins can record why a deal was rejected and
--     the agency sees it; a material edit by the owner (which the existing
--     guard already sends back to pending review) clears the stale reason.
-- (c) package_bookings.cancellation_reason: lets the agency decline a booking
--     with context. The wave-1 guard pins every field except status; this
--     recreation additionally allows cancellation_reason, but only on a row
--     whose (new) status is cancelled.

-- (a) departure delete guard --------------------------------------------------
create or replace function public.enforce_departure_delete_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role','') = 'service_role' then
    return old;
  end if;
  if exists (
    select 1 from public.package_bookings b
    where b.departure_id = old.id
      and coalesce(b.status, 'pending') in ('pending', 'confirmed')
  ) then
    raise exception 'Cannot delete a departure with active bookings; cancel the departure instead'
      using errcode = '42501';
  end if;
  return old;
end;
$$;

revoke execute on function public.enforce_departure_delete_guard() from public, anon, authenticated;

drop trigger if exists trg_enforce_departure_delete_guard on public.package_departures;
create trigger trg_enforce_departure_delete_guard
  before delete on public.package_departures
  for each row execute function public.enforce_departure_delete_guard();

-- (b) deal rejection reason ---------------------------------------------------
alter table public.deals add column if not exists rejection_reason text;

create or replace function public.guard_deal_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.has_role(auth.uid(), 'admin'::app_role) then
      new.approval_status := 'pending';
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  if not public.has_role(auth.uid(), 'admin'::app_role) then
    if new.approval_status is distinct from old.approval_status then
      new.approval_status := old.approval_status;
    end if;
    if new.rejection_reason is distinct from old.rejection_reason then
      new.rejection_reason := old.rejection_reason;
    end if;
    if (new.discount_percentage is distinct from old.discount_percentage)
       or (new.start_date is distinct from old.start_date)
       or (new.end_date is distinct from old.end_date)
       or (new.package_id is distinct from old.package_id) then
      -- Material edit: back to review, stale rejection reason cleared.
      new.approval_status := 'pending';
      new.rejection_reason := null;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_deal_approval() from public, anon, authenticated;

-- (c) booking cancellation reason --------------------------------------------
alter table public.package_bookings add column if not exists cancellation_reason text;

create or replace function public.enforce_booking_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

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

    if new.cancellation_reason is distinct from old.cancellation_reason
       and new.status <> 'cancelled' then
      raise exception 'A cancellation reason may only be set when cancelling the booking'
        using errcode = '42501';
    end if;

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

  raise exception 'Not authorized to modify this booking'
    using errcode = '42501';
end;
$$;

revoke execute on function public.enforce_booking_update_guard() from anon, authenticated;
