
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PackageDetails {
  id: string;
  title: string;
  title_ar?: string | null;
  description: string;
  description_ar?: string | null;
  destination: string;
  destination_ar?: string | null;
  duration_days: number;
  duration_nights: number;
  base_price: number;
  max_participants: number;
  difficulty_level: string;
  category: string;
  average_rating: number; // Added
  total_reviews: number; // Added
  inclusions: string[];
  inclusions_ar?: string[] | null;
  exclusions: string[];
  exclusions_ar?: string[] | null;
  requirements: string[];
  cancellation_policy: string;
  terms_conditions: string;
  featured: boolean;
  status: string;
  agency_id: string;
  available_from: string;
  available_to: string;
  created_at: string;
  updated_at: string;
  package_media?: Array<{
    id: string;
    file_path: string;
    file_name: string;
    media_type: string;
    caption: string;
    is_primary: boolean;
    display_order: number;
  }>;
  itineraries?: Array<{
    id: string;
    day_number: number;
    title: string;
    title_ar?: string | null;
    description: string;
    description_ar?: string | null;
    activities: string[];
    activities_ar?: string[] | null;
    meals_included: string[];
    accommodation: string;
    transportation: string;
  }>;
  package_routes?: Array<{
    id: string;
    name: string;
    name_ar: string | null;
    latitude: number;
    longitude: number;
    destination_order: number;
    destination_type: string;
    days_spent: number | null;
    place_id: string | null;
  }>;
  travel_agencies?: {
    id?: string;
    company_name: string;
    contact_person_first_name: string;
    contact_person_last_name: string;
    email: string;
    phone: string;
  };
}

export function usePackageDetails(packageId: string | undefined) {
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) {
      setLoading(false);
      setError('No package ID provided');
      return;
    }

    const fetchPackageDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('packages')
          .select(`
            *,
            average_rating,
            total_reviews,
            package_media (
              id,
              file_path,
              file_name,
              media_type,
              caption,
              is_primary,
              display_order
            ),
            itineraries (
              id,
              day_number,
              title,
              title_ar,
              description,
              description_ar,
              activities,
              activities_ar,
              meals_included,
              accommodation,
              transportation
            ),
            package_routes (
              id,
              name,
              name_ar,
              latitude,
              longitude,
              destination_order,
              destination_type,
              days_spent,
              place_id
            ),
            travel_agencies (
              id,
              company_name,
              contact_person_first_name,
              contact_person_last_name,
              email,
              phone
            )
          `)
          .eq('id', packageId)
          .eq('status', 'published')
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

        setPackageDetails(data as unknown as PackageDetails);
      } catch (err) {
        console.error('Error fetching package details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch package details');
      } finally {
        setLoading(false);
      }
    };

    fetchPackageDetails();
  }, [packageId]);

  return { packageDetails, loading, error };
}
