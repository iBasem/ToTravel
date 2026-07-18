-- Wave 2 (audit AGY-31 pairing / notifications gap): publish package_bookings
-- over realtime so the agency header badge updates when bookings arrive or
-- change. RLS still applies per subscriber — an agency only receives events
-- for rows its SELECT policy allows (own packages' bookings).

alter publication supabase_realtime add table public.package_bookings;
