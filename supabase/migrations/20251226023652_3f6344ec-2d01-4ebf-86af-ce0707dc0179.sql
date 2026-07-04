-- Create content_pages table for content management
CREATE TABLE public.content_pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    content_type TEXT NOT NULL DEFAULT 'page', -- page, legal, blog
    content TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published
    author_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agency_payouts table for financial management
CREATE TABLE public.agency_payouts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES public.travel_agencies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    commission_rate NUMERIC NOT NULL DEFAULT 0.12,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, failed
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_stats table for storing historical stats and reports
CREATE TABLE public.platform_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    stat_date DATE NOT NULL,
    total_bookings INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC NOT NULL DEFAULT 0,
    new_travelers INTEGER NOT NULL DEFAULT 0,
    new_agencies INTEGER NOT NULL DEFAULT 0,
    active_packages INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(stat_date)
);

-- Add status and commission_rate to travel_agencies if not exists
ALTER TABLE public.travel_agencies 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.12;

-- Add status to travelers for admin management
ALTER TABLE public.travelers 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Enable RLS on new tables
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

-- Content pages policies (admins only for write, public for read published)
CREATE POLICY "Anyone can view published content" ON public.content_pages
FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all content" ON public.content_pages
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Agency payouts policies (admins and respective agencies)
CREATE POLICY "Admins can manage all payouts" ON public.agency_payouts
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agencies can view their own payouts" ON public.agency_payouts
FOR SELECT USING (auth.uid() = agency_id);

-- Platform stats policies (admins only)
CREATE POLICY "Admins can view platform stats" ON public.platform_stats
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage platform stats" ON public.platform_stats
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to view all travelers
CREATE POLICY "Admins can view all travelers" ON public.travelers
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update travelers
CREATE POLICY "Admins can update all travelers" ON public.travelers
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to view all bookings
CREATE POLICY "Admins can view all bookings" ON public.package_bookings
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update all bookings  
CREATE POLICY "Admins can update all bookings" ON public.package_bookings
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to view all packages
CREATE POLICY "Admins can view all packages" ON public.packages
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update all packages
CREATE POLICY "Admins can update all packages" ON public.packages
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_content_pages_updated_at
BEFORE UPDATE ON public.content_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_payouts_updated_at
BEFORE UPDATE ON public.agency_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample content pages
INSERT INTO public.content_pages (title, slug, content_type, content, status) VALUES
('About ToTravel', 'about', 'page', 'Welcome to ToTravel, your premier travel marketplace...', 'published'),
('Terms & Conditions', 'terms', 'legal', 'These terms and conditions outline the rules...', 'published'),
('Privacy Policy', 'privacy', 'legal', 'Your privacy is important to us...', 'published'),
('Travel Safety Tips', 'travel-safety-tips', 'blog', 'Top 10 safety tips for your next adventure...', 'draft'),
('Top Destinations 2024', 'top-destinations-2024', 'blog', 'Discover the hottest travel destinations...', 'published');

-- Insert sample platform stats for the last 6 months
INSERT INTO public.platform_stats (stat_date, total_bookings, total_revenue, new_travelers, new_agencies, active_packages) VALUES
(CURRENT_DATE - INTERVAL '6 months', 145, 12400, 89, 12, 234),
(CURRENT_DATE - INTERVAL '5 months', 168, 15200, 112, 8, 256),
(CURRENT_DATE - INTERVAL '4 months', 192, 18900, 134, 15, 289),
(CURRENT_DATE - INTERVAL '3 months', 158, 14800, 98, 6, 301),
(CURRENT_DATE - INTERVAL '2 months', 210, 22100, 156, 18, 345),
(CURRENT_DATE - INTERVAL '1 month', 234, 26500, 189, 22, 378);