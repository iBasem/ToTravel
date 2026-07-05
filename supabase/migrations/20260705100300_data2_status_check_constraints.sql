-- DATA-2: Re-add CHECK constraints that were lost in the Dec-2025 schema
-- rebuild, so status/payment columns can't hold arbitrary free text (a typo
-- like 'Published' silently hides a package; free-text payment state is unsafe).
-- Value sets are supersets of what the app actually writes (verified in code);
-- existing rows already conform. NULL passes a CHECK, so nullable columns with
-- defaults are unaffected.
--
-- Deferred intentionally: packages.category / packages.difficulty_level (need
-- the wizard's exact option lists first) and travel_agencies.status (need the
-- verification-approval value first).

alter table public.packages
  drop constraint if exists packages_status_check,
  add constraint packages_status_check
  check (status in ('draft','pending','published','archived','suspended'));

alter table public.package_bookings
  drop constraint if exists package_bookings_status_check,
  add constraint package_bookings_status_check
  check (status in ('pending','confirmed','completed','cancelled'));

alter table public.package_bookings
  drop constraint if exists package_bookings_payment_status_check,
  add constraint package_bookings_payment_status_check
  check (payment_status in ('pending','paid','refunded','failed'));

alter table public.agency_payouts
  drop constraint if exists agency_payouts_status_check,
  add constraint agency_payouts_status_check
  check (status in ('pending','processing','processed','failed'));
