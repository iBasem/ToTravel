-- Create package_routes table to store tour destinations/stops
CREATE TABLE public.package_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  destination_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  name_ar TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  place_id TEXT,
  destination_type TEXT NOT NULL DEFAULT 'stop' CHECK (destination_type IN ('origin', 'stop', 'destination')),
  days_spent INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_package_routes_package_id ON public.package_routes(package_id);
CREATE INDEX idx_package_routes_order ON public.package_routes(package_id, destination_order);

-- Enable Row Level Security
ALTER TABLE public.package_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for package_routes
CREATE POLICY "Agencies can create routes for their packages"
ON public.package_routes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM packages p
    WHERE p.id = package_routes.package_id
    AND p.agency_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Agencies can update routes for their packages"
ON public.package_routes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM packages p
    WHERE p.id = package_routes.package_id
    AND p.agency_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Agencies can delete routes for their packages"
ON public.package_routes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM packages p
    WHERE p.id = package_routes.package_id
    AND p.agency_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Agencies can view routes for their packages"
ON public.package_routes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM packages p
    WHERE p.id = package_routes.package_id
    AND p.agency_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Anyone can view routes for published packages"
ON public.package_routes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM packages p
    WHERE p.id = package_routes.package_id
    AND p.status = 'published'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_package_routes_updated_at
BEFORE UPDATE ON public.package_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();