-- Reviews are now created exclusively through the create-review edge
-- function (service role), which verifies the booking belongs to the
-- caller and is completed, and derives package_id from the booking.
DROP POLICY IF EXISTS "Travelers can insert their own reviews" ON public.reviews;

-- Drop the unused traveler UPDATE policy: it allowed changing package_id/
-- booking_id on an existing review (moving it to a package they never
-- booked), and no app flow updates reviews. Deleting own reviews remains.
DROP POLICY IF EXISTS "Travelers can update their own reviews" ON public.reviews;
