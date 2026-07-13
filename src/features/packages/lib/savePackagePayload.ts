import type { PackageFormData } from "@/features/packages/types/wizard";

// Builds the JSONB payload for the `save_package` RPC from the wizard's form
// state. Shared by create and edit so the two paths can't drift. Maps the
// form's field names to the DB's (day/meals -> day_number/meals_included,
// type/isPrimary -> media_type/is_primary) and flattens structured inclusions.
export function buildSavePackagePayload(formData: PackageFormData) {
  const inclusions: string[] = [];
  Object.values(formData.pricing.inclusions).forEach((v) => {
    if (v?.included && v?.details) inclusions.push(...v.details);
  });
  if (Array.isArray(formData.pricing.additionalInclusions)) {
    inclusions.push(...formData.pricing.additionalInclusions);
  }

  return {
    basicInfo: {
      title: formData.basicInfo.title,
      description: formData.basicInfo.description,
      destination: formData.basicInfo.destination,
      title_ar: formData.basicInfo.title_ar,
      description_ar: formData.basicInfo.description_ar,
      destination_ar: formData.basicInfo.destination_ar,
      category: formData.basicInfo.category,
      difficulty_level: formData.basicInfo.difficulty_level,
      duration_days: formData.basicInfo.duration_days,
      duration_nights: formData.basicInfo.duration_nights,
      max_participants: formData.basicInfo.max_participants,
      highlights: (formData.basicInfo.highlights || []).filter((h) => h && h.trim()),
    },
    pricing: {
      base_price: parseFloat(formData.pricing.basePrice) || 0,
      inclusions,
      exclusions: formData.pricing.exclusions || [],
      inclusions_ar: formData.pricing.inclusions_ar || [],
      exclusions_ar: formData.pricing.exclusions_ar || [],
      cancellation_policy: formData.pricing.cancellation_policy || "",
      terms_conditions: formData.pricing.terms_conditions || "",
    },
    routes: (formData.route?.destinations || []).map((d, i) => ({
      name: d.name,
      name_ar: d.nameAr || null,
      latitude: d.latitude,
      longitude: d.longitude,
      place_id: d.placeId || null,
      destination_type: d.type,
      days_spent: d.daysSpent,
      destination_order: d.order ?? i,
    })),
    itinerary: (formData.itinerary || []).map((d, i) => ({
      day_number: d.day ?? i + 1,
      title: d.title,
      description: d.description,
      activities: (d.activities || []).filter((a) => a && a.trim()),
      meals_included: d.meals || [],
      accommodation: d.accommodation || null,
      transportation: d.transportation || null,
      title_ar: d.title_ar,
      description_ar: d.description_ar,
      activities_ar: d.activities_ar || [],
    })),
    media: (formData.media || []).map((m, i) => ({
      file_name: m.file_name || "",
      file_path: m.file_path || m.url,
      media_type: m.type,
      caption: m.caption || null,
      is_primary: m.isPrimary,
      display_order: i,
    })),
  };
}
