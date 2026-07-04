-- =============================================
-- ToTravel Database Schema Migration
-- =============================================

-- Create enum for user roles (stored in separate table for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'agency', 'traveler');

-- Create user_roles table (for secure role management)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- TRAVELERS TABLE
-- =============================================
CREATE TABLE public.travelers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    nationality TEXT,
    passport_number TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.travelers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TRAVEL AGENCIES TABLE
-- =============================================
CREATE TABLE public.travel_agencies (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_description TEXT,
    contact_person_first_name TEXT NOT NULL DEFAULT '',
    contact_person_last_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    avatar_url TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    license_number TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_agencies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PACKAGES TABLE
-- =============================================
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.travel_agencies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 1,
    duration_nights INTEGER NOT NULL DEFAULT 0,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_participants INTEGER DEFAULT 20,
    difficulty_level TEXT DEFAULT 'easy',
    category TEXT DEFAULT 'cultural',
    inclusions TEXT[] DEFAULT '{}',
    exclusions TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    cancellation_policy TEXT,
    terms_conditions TEXT,
    featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft',
    available_from DATE,
    available_to DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ITINERARIES TABLE
-- =============================================
CREATE TABLE public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    activities TEXT[] DEFAULT '{}',
    meals_included TEXT[] DEFAULT '{}',
    accommodation TEXT,
    transportation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PACKAGE MEDIA TABLE
-- =============================================
CREATE TABLE public.package_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.package_media ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PACKAGE BOOKINGS TABLE
-- =============================================
CREATE TABLE public.package_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    participants INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    special_requests TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.package_bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES VIEW (combines travelers and agencies)
-- =============================================
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    t.id,
    t.email,
    t.first_name,
    t.last_name,
    t.phone,
    t.avatar_url,
    'traveler'::TEXT AS role,
    NULL::TEXT AS company_name,
    NULL::TEXT AS company_description,
    t.created_at,
    t.updated_at
FROM public.travelers t
UNION ALL
SELECT 
    a.id,
    a.email,
    a.contact_person_first_name AS first_name,
    a.contact_person_last_name AS last_name,
    a.phone,
    a.avatar_url,
    'agency'::TEXT AS role,
    a.company_name,
    a.company_description,
    a.created_at,
    a.updated_at
FROM public.travel_agencies a;

-- =============================================
-- TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_travelers_updated_at
    BEFORE UPDATE ON public.travelers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_agencies_updated_at
    BEFORE UPDATE ON public.travel_agencies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_bookings_updated_at
    BEFORE UPDATE ON public.package_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER: Create traveler/agency on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'traveler');
    
    IF user_role = 'agency' THEN
        INSERT INTO public.travel_agencies (id, email, company_name, contact_person_first_name, contact_person_last_name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'My Agency'),
            COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
            COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
        );
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'agency');
    ELSE
        INSERT INTO public.travelers (id, email, first_name, last_name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
            COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
        );
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'traveler');
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES: user_roles
-- =============================================
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: travelers
-- =============================================
CREATE POLICY "Travelers can view their own profile"
    ON public.travelers FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Travelers can update their own profile"
    ON public.travelers FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Agencies can view travelers who booked their packages"
    ON public.travelers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.package_bookings pb
            JOIN public.packages p ON pb.package_id = p.id
            WHERE pb.traveler_id = travelers.id
            AND p.agency_id = auth.uid()
        )
    );

-- =============================================
-- RLS POLICIES: travel_agencies
-- =============================================
CREATE POLICY "Anyone can view travel agencies"
    ON public.travel_agencies FOR SELECT
    USING (true);

CREATE POLICY "Agencies can update their own profile"
    ON public.travel_agencies FOR UPDATE
    USING (auth.uid() = id);

-- =============================================
-- RLS POLICIES: packages
-- =============================================
CREATE POLICY "Anyone can view published packages"
    ON public.packages FOR SELECT
    USING (status = 'published');

CREATE POLICY "Agencies can view their own packages"
    ON public.packages FOR SELECT
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can create their own packages"
    ON public.packages FOR INSERT
    WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own packages"
    ON public.packages FOR UPDATE
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can delete their own packages"
    ON public.packages FOR DELETE
    USING (auth.uid() = agency_id);

-- =============================================
-- RLS POLICIES: itineraries
-- =============================================
CREATE POLICY "Anyone can view itineraries for published packages"
    ON public.itineraries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = itineraries.package_id
            AND p.status = 'published'
        )
    );

CREATE POLICY "Agencies can view itineraries for their packages"
    ON public.itineraries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = itineraries.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can create itineraries for their packages"
    ON public.itineraries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = itineraries.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can update itineraries for their packages"
    ON public.itineraries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = itineraries.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can delete itineraries for their packages"
    ON public.itineraries FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = itineraries.package_id
            AND p.agency_id = auth.uid()
        )
    );

-- =============================================
-- RLS POLICIES: package_media
-- =============================================
CREATE POLICY "Anyone can view media for published packages"
    ON public.package_media FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = package_media.package_id
            AND p.status = 'published'
        )
    );

CREATE POLICY "Agencies can view media for their packages"
    ON public.package_media FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = package_media.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can create media for their packages"
    ON public.package_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = package_media.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can update media for their packages"
    ON public.package_media FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = package_media.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can delete media for their packages"
    ON public.package_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = package_media.package_id
            AND p.agency_id = auth.uid()
        )
    );

-- =============================================
-- RLS POLICIES: package_bookings
-- =============================================
CREATE POLICY "Travelers can view their own bookings"
    ON public.package_bookings FOR SELECT
    USING (auth.uid() = traveler_id);

CREATE POLICY "Agencies can view bookings for their packages"
    ON public.package_bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = package_bookings.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Travelers can create bookings"
    ON public.package_bookings FOR INSERT
    WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Agencies can update bookings for their packages"
    ON public.package_bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.packages p
            WHERE p.id = package_bookings.package_id
            AND p.agency_id = auth.uid()
        )
    );

CREATE POLICY "Travelers can update their own bookings"
    ON public.package_bookings FOR UPDATE
    USING (auth.uid() = traveler_id);

-- =============================================
-- STORAGE BUCKET: package-media
-- =============================================
-- (bucket may already exist from the June-era migration; identical config)
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-media', 'package-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for package media
CREATE POLICY "Anyone can view package media files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'package-media');

CREATE POLICY "Authenticated users can upload package media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'package-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own media files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'package-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'package-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_packages_agency_id ON public.packages(agency_id);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_featured ON public.packages(featured);
CREATE INDEX idx_packages_destination ON public.packages(destination);
CREATE INDEX idx_itineraries_package_id ON public.itineraries(package_id);
CREATE INDEX idx_package_media_package_id ON public.package_media(package_id);
CREATE INDEX idx_package_bookings_traveler_id ON public.package_bookings(traveler_id);
CREATE INDEX idx_package_bookings_package_id ON public.package_bookings(package_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);