
-- =====================================================
-- FIX RLS PERFORMANCE: Wrap auth.uid() in SELECT
-- This ensures auth.uid() is evaluated once per statement, not per row
-- =====================================================

-- 1. Fix user_roles policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 2. Fix travelers policies
DROP POLICY IF EXISTS "Travelers can view their own profile" ON public.travelers;
CREATE POLICY "Travelers can view their own profile" 
ON public.travelers 
FOR SELECT 
TO authenticated
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Travelers can update their own profile" ON public.travelers;
CREATE POLICY "Travelers can update their own profile" 
ON public.travelers 
FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = id);

-- 3. Fix travel_agencies policies
DROP POLICY IF EXISTS "Agencies can update their own profile" ON public.travel_agencies;
CREATE POLICY "Agencies can update their own profile" 
ON public.travel_agencies 
FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = id);

-- 4. Fix package_bookings policies
DROP POLICY IF EXISTS "Travelers can view their own bookings" ON public.package_bookings;
CREATE POLICY "Travelers can view their own bookings" 
ON public.package_bookings 
FOR SELECT 
TO authenticated
USING ((SELECT auth.uid()) = traveler_id);

DROP POLICY IF EXISTS "Travelers can create bookings" ON public.package_bookings;
CREATE POLICY "Travelers can create bookings" 
ON public.package_bookings 
FOR INSERT 
TO authenticated
WITH CHECK ((SELECT auth.uid()) = traveler_id);

DROP POLICY IF EXISTS "Travelers can update their own bookings" ON public.package_bookings;
CREATE POLICY "Travelers can update their own bookings" 
ON public.package_bookings 
FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = traveler_id);

-- 5. Fix packages policies
DROP POLICY IF EXISTS "Agencies can view their own packages" ON public.packages;
CREATE POLICY "Agencies can view their own packages" 
ON public.packages 
FOR SELECT 
TO authenticated
USING ((SELECT auth.uid()) = agency_id);

DROP POLICY IF EXISTS "Agencies can create their own packages" ON public.packages;
CREATE POLICY "Agencies can create their own packages" 
ON public.packages 
FOR INSERT 
TO authenticated
WITH CHECK ((SELECT auth.uid()) = agency_id);

DROP POLICY IF EXISTS "Agencies can update their own packages" ON public.packages;
CREATE POLICY "Agencies can update their own packages" 
ON public.packages 
FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = agency_id);

DROP POLICY IF EXISTS "Agencies can delete their own packages" ON public.packages;
CREATE POLICY "Agencies can delete their own packages" 
ON public.packages 
FOR DELETE 
TO authenticated
USING ((SELECT auth.uid()) = agency_id);

-- 6. Fix agency_payouts policy
DROP POLICY IF EXISTS "Agencies can view their own payouts" ON public.agency_payouts;
CREATE POLICY "Agencies can view their own payouts" 
ON public.agency_payouts 
FOR SELECT 
TO authenticated
USING ((SELECT auth.uid()) = agency_id);

-- 7. Fix itineraries policies (subquery optimization)
DROP POLICY IF EXISTS "Agencies can view itineraries for their packages" ON public.itineraries;
CREATE POLICY "Agencies can view itineraries for their packages" 
ON public.itineraries 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = itineraries.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Agencies can create itineraries for their packages" ON public.itineraries;
CREATE POLICY "Agencies can create itineraries for their packages" 
ON public.itineraries 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = itineraries.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Agencies can update itineraries for their packages" ON public.itineraries;
CREATE POLICY "Agencies can update itineraries for their packages" 
ON public.itineraries 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = itineraries.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Agencies can delete itineraries for their packages" ON public.itineraries;
CREATE POLICY "Agencies can delete itineraries for their packages" 
ON public.itineraries 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = itineraries.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

-- 8. Fix package_media policies (subquery optimization)
DROP POLICY IF EXISTS "Agencies can view media for their packages" ON public.package_media;
CREATE POLICY "Agencies can view media for their packages" 
ON public.package_media 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = package_media.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Agencies can create media for their packages" ON public.package_media;
CREATE POLICY "Agencies can create media for their packages" 
ON public.package_media 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = package_media.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Agencies can update media for their packages" ON public.package_media;
CREATE POLICY "Agencies can update media for their packages" 
ON public.package_media 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = package_media.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Agencies can delete media for their packages" ON public.package_media;
CREATE POLICY "Agencies can delete media for their packages" 
ON public.package_media 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = package_media.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

-- 9. Fix package_bookings agency policies (subquery optimization)
DROP POLICY IF EXISTS "Agencies can view bookings for their packages" ON public.package_bookings;
CREATE POLICY "Agencies can view bookings for their packages" 
ON public.package_bookings 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = package_bookings.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Agencies can update bookings for their packages" ON public.package_bookings;
CREATE POLICY "Agencies can update bookings for their packages" 
ON public.package_bookings 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = package_bookings.package_id 
  AND p.agency_id = (SELECT auth.uid())
));

-- 10. Fix travelers policy for agencies (subquery optimization)
DROP POLICY IF EXISTS "Agencies can view travelers who booked their packages" ON public.travelers;
CREATE POLICY "Agencies can view travelers who booked their packages" 
ON public.travelers 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM package_bookings pb
  JOIN packages p ON pb.package_id = p.id
  WHERE pb.traveler_id = travelers.id 
  AND p.agency_id = (SELECT auth.uid())
));
