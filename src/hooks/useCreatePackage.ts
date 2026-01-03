
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface RouteDestination {
  id: string;
  name: string;
  nameAr?: string;
  latitude: number;
  longitude: number;
  order: number;
  type: 'origin' | 'stop' | 'destination';
  daysSpent: number;
  placeId?: string;
}

interface CreatePackageData {
  basicInfo: {
    title: string;
    description: string;
    destination: string;
    category: string;
    difficulty_level: string;
    duration_days: number;
    duration_nights: number;
    max_participants: number;
    featured: boolean;
  };
  route?: {
    destinations: RouteDestination[];
    travelMode?: string;
    showDistances?: boolean;
  };
  itinerary: Array<{
    day_number: number;
    title: string;
    description: string;
    activities: string[];
    meals_included: string[];
    accommodation?: string;
    transportation?: string;
  }>;
  pricing: {
    base_price: number;
    inclusions: string[];
    exclusions: string[];
    cancellation_policy: string;
    terms_conditions: string;
  };
  media: Array<{
    file_name: string;
    file_path: string;
    media_type: string;
    caption?: string;
    is_primary: boolean;
  }>;
}

export function useCreatePackage() {
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const createPackage = async (packageData: CreatePackageData) => {
    if (!user || !profile || profile.role !== 'agency') {
      toast.error('You must be logged in as a travel agency to create packages');
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    try {
      // Create the main package
      const { data: packageResult, error: packageError } = await supabase
        .from('packages')
        .insert({
          agency_id: user.id,
          title: packageData.basicInfo.title,
          description: packageData.basicInfo.description,
          destination: packageData.basicInfo.destination,
          category: packageData.basicInfo.category,
          difficulty_level: packageData.basicInfo.difficulty_level,
          duration_days: packageData.basicInfo.duration_days,
          duration_nights: packageData.basicInfo.duration_nights,
          max_participants: packageData.basicInfo.max_participants,
          featured: packageData.basicInfo.featured,
          base_price: packageData.pricing.base_price,
          inclusions: packageData.pricing.inclusions,
          exclusions: packageData.pricing.exclusions,
          cancellation_policy: packageData.pricing.cancellation_policy,
          terms_conditions: packageData.pricing.terms_conditions,
          status: 'draft'
        })
        .select()
        .single();

      if (packageError) {
        throw packageError;
      }

      const packageId = packageResult.id;

      // Create route destinations if any
      if (packageData.route?.destinations && packageData.route.destinations.length > 0) {
        const routeInserts = packageData.route.destinations.map((dest, index) => ({
          package_id: packageId,
          destination_order: index,
          name: dest.name,
          name_ar: dest.nameAr || null,
          latitude: dest.latitude,
          longitude: dest.longitude,
          place_id: dest.placeId || null,
          destination_type: dest.type,
          days_spent: dest.daysSpent
        }));

        const { error: routeError } = await supabase
          .from('package_routes')
          .insert(routeInserts);

        if (routeError) {
          console.error('Error creating routes:', routeError);
          // Don't fail the entire package creation for route errors
        }
      }

      // Create itinerary items if any
      if (packageData.itinerary.length > 0) {
        const itineraryInserts = packageData.itinerary.map(item => ({
          package_id: packageId,
          day_number: item.day_number,
          title: item.title,
          description: item.description,
          activities: item.activities,
          meals_included: item.meals_included,
          accommodation: item.accommodation,
          transportation: item.transportation
        }));

        const { error: itineraryError } = await supabase
          .from('itineraries')
          .insert(itineraryInserts);

        if (itineraryError) {
          console.error('Error creating itinerary:', itineraryError);
          // Don't fail the entire package creation for itinerary errors
        }
      }

      // Create media items if any
      if (packageData.media.length > 0) {
        const mediaInserts = packageData.media.map((media, index) => ({
          package_id: packageId,
          file_name: media.file_name,
          file_path: media.file_path,
          media_type: media.media_type,
          caption: media.caption,
          is_primary: media.is_primary,
          display_order: index
        }));

        const { error: mediaError } = await supabase
          .from('package_media')
          .insert(mediaInserts);

        if (mediaError) {
          console.error('Error creating media:', mediaError);
          // Don't fail the entire package creation for media errors
        }
      }

      toast.success('Package created successfully!');
      navigate('/travel_agency/packages');
      return { success: true, data: packageResult };
    } catch (error) {
      console.error('Package creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create package';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    createPackage,
    loading
  };
}
