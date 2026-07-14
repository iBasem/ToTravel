import type { PackageFormData } from "@/features/packages/types/wizard";

// Pristine form state shared by the editor (create mode) and tests.
export const createInitialPackageFormData = (): PackageFormData => ({
  basicInfo: {
    title: '',
    description: '',
    destination: '',
    title_ar: '',
    description_ar: '',
    destination_ar: '',
    destinations: [],
    category: '',
    package_type: 'group',
    difficulty_level: 'moderate',
    duration_days: 1,
    duration_nights: 0,
    max_participants: 20,
    featured: false,
    highlights: []
  },
  route: {
    destinations: [],
    travelMode: 'driving',
    showDistances: true
  },
  itinerary: [],
  pricing: {
    basePrice: "",
    flight_option: 'not_included',
    addons: [],
    inclusions: {
      accommodation: { included: false, details: [] },
      meals: { included: false, details: [] },
      transportation: { included: false, details: [] },
      activities: { included: false, details: [] },
      guides: { included: false, details: [] },
      insurance: { included: false, details: [] },
      other: { included: false, details: [] }
    },
    additionalInclusions: [],
    exclusions: [],
    inclusions_ar: [],
    exclusions_ar: [],
    cancellation_policy: '',
    terms_conditions: ''
  },
  media: []
});
