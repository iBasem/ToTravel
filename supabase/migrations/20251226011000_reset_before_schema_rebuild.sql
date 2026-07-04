-- Reproduces the platform reset that preceded the 20251226 schema rebuild.
-- The database has no data at this point; June-era objects are dropped so the
-- rebuild migration can run exactly as originally authored.
-- (storage bucket 'package-media' is kept: deletion is API-only and the
-- rebuild recreates it with identical config)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP VIEW IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.package_bookings CASCADE;
DROP TABLE IF EXISTS public.package_media CASCADE;
DROP TABLE IF EXISTS public.itineraries CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.travel_agencies CASCADE;
DROP TABLE IF EXISTS public.travelers CASCADE;
DROP TYPE IF EXISTS public.user_role;
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.handle_travelers_updated_at();
DROP FUNCTION IF EXISTS public.handle_agencies_updated_at();
DROP FUNCTION IF EXISTS public.handle_packages_updated_at();
DROP FUNCTION IF EXISTS public.handle_bookings_updated_at();
DROP POLICY IF EXISTS "Anyone can view package media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload package media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own package media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own package media" ON storage.objects;
