-- WIZ-11b: Link bookings to a specific departure.
--
-- Adds package_bookings.departure_id and makes the capacity guard
-- departure-aware: when a booking targets a departure, seats are enforced
-- against that departure's total_seats (counting bookings for the same
-- departure); otherwise it falls back to the per-date / max_participants rule
-- for legacy free-date bookings.

alter table public.package_bookings
  add column if not exists departure_id uuid
  references public.package_departures(id) on delete set null;

create index if not exists idx_package_bookings_departure_id
  on public.package_bookings(departure_id);

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
  if coalesce(new.status, 'pending') = 'cancelled' then
    return new;
  end if;

  if new.departure_id is not null then
    -- Enforce against the specific departure's seats.
    select total_seats into cap
    from public.package_departures
    where id = new.departure_id
    for update;
    if cap is null then
      return new;
    end if;
    select coalesce(sum(participants), 0) into booked
    from public.package_bookings
    where departure_id = new.departure_id
      and coalesce(status, 'pending') in ('pending','confirmed','completed')
      and id is distinct from new.id;
  else
    -- Legacy free-date booking: enforce per (package_id, booking_date).
    select max_participants into cap
    from public.packages
    where id = new.package_id
    for update;
    if cap is null then
      return new;
    end if;
    select coalesce(sum(participants), 0) into booked
    from public.package_bookings
    where package_id = new.package_id
      and booking_date = new.booking_date
      and coalesce(status, 'pending') in ('pending','confirmed','completed')
      and id is distinct from new.id;
  end if;

  if booked + new.participants > cap then
    raise exception 'Booking exceeds available capacity (% of % seats already booked, requested %)',
      booked, cap, new.participants
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_booking_capacity() from public, anon, authenticated;

drop trigger if exists trg_enforce_booking_capacity on public.package_bookings;
create trigger trg_enforce_booking_capacity
  before insert or update of participants, booking_date, status, package_id, departure_id
  on public.package_bookings
  for each row execute function public.enforce_booking_capacity();
