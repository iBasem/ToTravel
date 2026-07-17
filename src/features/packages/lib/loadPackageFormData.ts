import { supabase } from "@/integrations/supabase/client";
import type { PackageFormData } from "@/features/packages/types/wizard";
import type { PackageType, FlightOption, HotelKind } from "@/features/packages/types/wizard";

// Loads a package graph into the editor's form shape. Shared by edit mode
// and duplicate-package (which strips identity and reuses the content).
// The agency filter is defense-in-depth on top of RLS.
export async function loadPackageFormData(
  id: string,
  agencyId: string
): Promise<{ formData: PackageFormData; status: string }> {
  const { data: packageData, error: packageError } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .eq('agency_id', agencyId)
    .single();

  if (packageError) throw packageError;

  const [{ data: routeData }, { data: itineraryData }, { data: mediaData }, { data: addonData }, { data: hotelData }] = await Promise.all([
    supabase.from('package_routes').select('*').eq('package_id', id).order('destination_order'),
    supabase.from('itineraries').select('*').eq('package_id', id).order('day_number'),
    supabase.from('package_media').select('*').eq('package_id', id).order('display_order'),
    supabase.from('package_addons').select('*').eq('package_id', id).order('display_order'),
    supabase.from('package_hotels').select('*').eq('package_id', id).order('display_order'),
  ]);

  const formData: PackageFormData = {
    basicInfo: {
      title: packageData.title || '',
      description: packageData.description || '',
      destination: packageData.destination || '',
      title_ar: packageData.title_ar || '',
      description_ar: packageData.description_ar || '',
      destination_ar: packageData.destination_ar || '',
      destinations: packageData.destination ? [packageData.destination] : [],
      category: packageData.category || '',
      package_type: (packageData.package_type || 'group') as PackageType,
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
    hotels: (hotelData || []).map(item => ({
      id: item.id,
      name: item.name,
      name_ar: item.name_ar || '',
      kind: (item.kind || 'hotel') as HotelKind,
      room_type: item.room_type || '',
      room_type_ar: item.room_type_ar || '',
      star_rating: item.star_rating ?? null,
      day_numbers: item.day_numbers || [],
      upgrade_available: item.upgrade_available ?? false,
      image_path: item.image_path ?? null,
    })),
    pricing: {
      basePrice: packageData.base_price?.toString() || '',
      flight_option: (packageData.flight_option || 'not_included') as FlightOption,
      addons: (addonData || []).map(item => ({
        id: item.id,
        name: item.name,
        name_ar: item.name_ar || '',
        price: item.price?.toString() || '0',
        per_person: item.per_person,
      })),
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
  };

  return { formData, status: packageData.status || 'draft' };
}

// A duplicate keeps the content but is a brand-new draft: suffixed title so
// two identical listings can't be confused. Departure dates are NOT copied
// (they are specific to the original's schedule).
export function asDuplicate(formData: PackageFormData): PackageFormData {
  return {
    ...formData,
    basicInfo: {
      ...formData.basicInfo,
      title: formData.basicInfo.title ? `${formData.basicInfo.title} (copy)` : '',
      title_ar: formData.basicInfo.title_ar ? `${formData.basicInfo.title_ar} (نسخة)` : '',
      featured: false,
    },
  };
}
