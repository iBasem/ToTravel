-- DATA-3: Stop deleting financial history via ON DELETE CASCADE.
--
-- Before: deleting a package cascaded to all its bookings (incl. paid ones) and
-- their reviews; deleting an agency cascaded to its payouts. An agency can
-- delete its own packages (RLS allows it), so a paid booking could vanish.
--
-- After: bookings block deletion of a referenced package (RESTRICT), and payouts
-- block deletion of a referenced agency (RESTRICT). Packages should be retired
-- via status='archived' (soft delete), not hard-deleted, once they have bookings.
--
-- Left as-is for now (needs a separate account-deletion / anonymization policy):
--   package_bookings.traveler_id -> travelers(id)  (still CASCADE)
--   reviews.* cascades

alter table public.package_bookings
  drop constraint if exists package_bookings_package_id_fkey,
  add constraint package_bookings_package_id_fkey
    foreign key (package_id) references public.packages(id) on delete restrict;

alter table public.agency_payouts
  drop constraint if exists agency_payouts_agency_id_fkey,
  add constraint agency_payouts_agency_id_fkey
    foreign key (agency_id) references public.travel_agencies(id) on delete restrict;
