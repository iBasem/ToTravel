-- Bookings are now created exclusively through the create-booking edge
-- function (service role), which computes total_price server-side.
-- Remove the direct-insert path so clients cannot supply their own price.
DROP POLICY IF EXISTS "Travelers can create bookings" ON public.package_bookings;
