import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PackageEditor } from "@/features/packages/components/editor/PackageEditor";
import type { PackageFormData } from "@/features/packages/types/wizard";

// Loads the package graph and hands it to the shared editor. The editor owns
// all state, saving, and autosave; this page is only the fetch + guard shell.
export default function EditPackage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<PackageFormData | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadPackage = useCallback(async () => {
    try {
      setLoading(true);

      // Load package data (agency filter is defense-in-depth on top of RLS)
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .eq('agency_id', user?.id ?? '')
        .single();

      if (packageError) throw packageError;

      const { data: routeData } = await supabase
        .from('package_routes')
        .select('*')
        .eq('package_id', id)
        .order('destination_order');

      const { data: itineraryData } = await supabase
        .from('itineraries')
        .select('*')
        .eq('package_id', id)
        .order('day_number');

      const { data: mediaData } = await supabase
        .from('package_media')
        .select('*')
        .eq('package_id', id)
        .order('display_order');

      setStatus(packageData.status || 'draft');
      setInitialData({
        basicInfo: {
          title: packageData.title || '',
          description: packageData.description || '',
          destination: packageData.destination || '',
          title_ar: packageData.title_ar || '',
          description_ar: packageData.description_ar || '',
          destination_ar: packageData.destination_ar || '',
          // The destinations array is a create-time UI construct (only the scalar
          // `destination` column is persisted); reconstruct it so validation and
          // the array-based UI work in edit mode.
          destinations: packageData.destination ? [packageData.destination] : [],
          category: packageData.category || '',
          difficulty_level: packageData.difficulty_level || 'moderate',
          duration_days: packageData.duration_days || 1,
          duration_nights: packageData.duration_nights || 0,
          max_participants: packageData.max_participants || 20,
          highlights: packageData.highlights || [],
          featured: packageData.featured || false
        },
        route: {
          destinations: (routeData || []).map(item => ({
            id: item.id,
            name: item.name,
            nameAr: item.name_ar,
            latitude: item.latitude,
            longitude: item.longitude,
            order: item.destination_order,
            type: item.destination_type as 'origin' | 'stop' | 'destination',
            daysSpent: item.days_spent || 1,
            placeId: item.place_id
          })),
          travelMode: 'driving' as const,
          showDistances: true
        },
        itinerary: (itineraryData || []).map(item => ({
          day: item.day_number,
          title: item.title,
          description: item.description,
          activities: item.activities || [],
          meals: item.meals_included || [],
          accommodation: item.accommodation || '',
          transportation: item.transportation || '',
          title_ar: item.title_ar || '',
          description_ar: item.description_ar || '',
          activities_ar: item.activities_ar || []
        })),
        pricing: {
          basePrice: packageData.base_price?.toString() || '',
          inclusions: {
            accommodation: { included: false, details: [] },
            meals: { included: false, details: [] },
            transportation: { included: false, details: [] },
            activities: { included: false, details: [] },
            guides: { included: false, details: [] },
            insurance: { included: false, details: [] },
            other: { included: false, details: [] }
          },
          additionalInclusions: packageData.inclusions || [],
          exclusions: packageData.exclusions || [],
          inclusions_ar: packageData.inclusions_ar || [],
          exclusions_ar: packageData.exclusions_ar || [],
          cancellation_policy: packageData.cancellation_policy || '',
          terms_conditions: packageData.terms_conditions || ''
        },
        media: (mediaData || []).map(item => ({
          id: item.id,
          type: (item.media_type || 'image') as 'image' | 'video',
          url: item.file_path,
          caption: item.caption || item.file_name,
          isPrimary: item.is_primary || false,
          file_name: item.file_name,
          file_path: item.file_path
        }))
      });
    } catch (error) {
      console.error('Error loading package:', error);
      toast.error(t('agencyDashboard.errorLoadingPackages', 'Failed to load package'));
      navigate('/travel_agency/packages');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, navigate, t]);

  useEffect(() => {
    if (id && user?.id) {
      loadPackage();
    }
  }, [id, user?.id, loadPackage]);

  if (loading || !initialData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <PackageEditor
      mode="edit"
      packageId={id ?? null}
      initialData={initialData}
      initialStatus={status}
    />
  );
}
