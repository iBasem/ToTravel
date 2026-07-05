-- BUS-2: Enforce booking capacity at the database level to prevent overselling
-- and the concurrent-booking race the per-request check in create-booking can't
-- stop. Capacity is enforced per (package_id, booking_date) — i.e. per departure
-- date — against packages.max_participants, which is the only inventory the
-- current schema models. NOTE: this is an interim guard; a proper departures /
-- inventory model (BUS-4) should replace the faked availability and may refine
-- how capacity is scoped. The trigger fires for ALL callers including the
-- service-role edge function, which is the intended enforcement point.

create or replace function public.enforce_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap integer;
  booked integer;
begin
  -- Cancelled bookings don't consume capacity.
  if coalesce(new.status, 'pending') = 'cancelled' then
    return new;
  end if;

  -- Lock the package row to serialize concurrent bookings for the same package.
  select max_participants into cap
  from public.packages
  where id = new.package_id
  for update;

  if cap is null then
    return new; -- no capacity configured; nothing to enforce
  end if;

  select coalesce(sum(participants), 0) into booked
  from public.package_bookings
  where package_id = new.package_id
    and booking_date = new.booking_date
    and coalesce(status, 'pending') in ('pending','confirmed','completed')
    and id is distinct from new.id;

  if booked + new.participants > cap then
    raise exception 'Booking exceeds available capacity for % (% of % seats already booked, requested %)',
      new.booking_date, booked, cap, new.participants
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_booking_capacity() from anon, authenticated;

drop trigger if exists trg_enforce_booking_capacity on public.package_bookings;
create trigger trg_enforce_booking_capacity
  before insert or update of participants, booking_date, status, package_id
  on public.package_bookings
  for each row execute function public.enforce_booking_capacity();
