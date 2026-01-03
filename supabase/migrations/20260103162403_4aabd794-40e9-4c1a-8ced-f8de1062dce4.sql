
-- =====================================================
-- FIX SECURITY & PERFORMANCE ISSUES
-- =====================================================

-- 1. Add missing indexes for RLS policy performance
-- These columns are used in RLS policies and need indexes for efficient query execution

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_user_id ON public.admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_payouts_agency_id ON public.agency_payouts(agency_id);
CREATE INDEX IF NOT EXISTS idx_content_pages_author_id ON public.content_pages(author_id);

-- 2. Add indexes on status columns used in RLS policies for better performance
CREATE INDEX IF NOT EXISTS idx_content_pages_status ON public.content_pages(status);
CREATE INDEX IF NOT EXISTS idx_travelers_status ON public.travelers(status);
CREATE INDEX IF NOT EXISTS idx_travel_agencies_status ON public.travel_agencies(status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_status ON public.package_bookings(status);

-- 3. Fix the SECURITY DEFINER view issue
-- The profiles view was created with SECURITY DEFINER which is a security risk
-- Recreate it with SECURITY INVOKER (default)

DROP VIEW IF EXISTS public.profiles;

CREATE VIEW public.profiles 
WITH (security_invoker = true)
AS
SELECT 
    COALESCE(t.id, ta.id) AS id,
    COALESCE(t.email, ta.email) AS email,
    COALESCE(t.first_name, ta.contact_person_first_name) AS first_name,
    COALESCE(t.last_name, ta.contact_person_last_name) AS last_name,
    COALESCE(t.phone, ta.phone) AS phone,
    COALESCE(t.avatar_url, ta.avatar_url) AS avatar_url,
    ta.company_name,
    ta.company_description,
    COALESCE(t.created_at, ta.created_at) AS created_at,
    COALESCE(t.updated_at, ta.updated_at) AS updated_at,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = COALESCE(t.id, ta.id) 
            AND ur.role = 'admin'::app_role
        ) THEN 'admin'::text
        WHEN ta.id IS NOT NULL THEN 'agency'::text
        ELSE 'traveler'::text
    END AS role
FROM travelers t
FULL JOIN travel_agencies ta ON t.id = ta.id;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
