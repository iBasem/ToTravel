// Shared shape for the package create/edit wizard's `formData`.
//
// Designed to match the orchestrator's initial state exactly (required fields),
// with the step-only / transient scratch fields (add-item inputs, and fields
// collected by a step but not persisted) marked optional so both the lean
// orchestrator state and the richer per-step state satisfy the type.
//
// See BACKEND-GAP-ANALYSIS.md (package-wizard investigation) for which fields
// are persisted vs. dead, and the known bugs this typing surfaces.

// Reuse the canonical route types the RouteStep already defines, so the shared
// form type stays consistent with the route sub-components.
import type { RouteData } from "@/features/packages/components/wizard-steps/route/types";
export type { RouteData, RouteDestination } from "@/features/packages/components/wizard-steps/route/types";

export interface InclusionCategory {
  included: boolean;
  details: string[];
}

// Who the package is for — orthogonal to `category` (kind of experience).
export type PackageType = 'honeymoon' | 'family' | 'group' | 'solo';
export const PACKAGE_TYPES: PackageType[] = ['group', 'family', 'honeymoon', 'solo'];

// International flights: bundled in the price, booked by the traveler, or
// offered as an optional paid add-on (defined in the add-ons list below).
export type FlightOption = 'not_included' | 'included' | 'optional';

// A priced optional extra the traveler can select at booking (flight,
// transfer, insurance, honeymoon extras, ...). Price is a string in the
// form (like basePrice); numeric in the payload/DB.
export interface PackageAddonForm {
  id?: string; // DB row id when loaded; absent for new rows
  name: string;
  name_ar: string;
  price: string;
  per_person: boolean;
}

export interface PackageBasicInfo {
  title: string;
  description: string;
  destination: string; // legacy scalar
  destinations: string[]; // authoritative list (create flow)
  title_ar: string;
  description_ar: string;
  destination_ar: string;
  category: string;
  package_type: PackageType;
  difficulty_level: string;
  duration_days: number;
  duration_nights: number;
  max_participants: number;
  featured: boolean; // NOTE: agency should not self-feature (see gap analysis M1)
  highlights?: string[]; // persisted to packages.highlights via save_package
  // step-only / not persisted:
  newHighlight?: string;
  rating?: number;
}

export interface ItineraryDay {
  day: number; // NB: persisted column is itineraries.day_number
  title: string;
  description: string;
  activities: string[];
  meals: string[]; // NB: persisted column is itineraries.meals_included
  accommodation: string;
  // Legacy column with no wizard input; round-tripped so edits don't erase it.
  transportation?: string;
  title_ar: string;
  description_ar: string;
  activities_ar: string[];
  // transient add-item inputs (kept in section-local UI state, not persisted):
  newActivity?: string;
  newActivityAr?: string;
}

export interface PackagePricing {
  currency?: string; // legacy; platform currency is fixed (getPlatformCurrency)
  basePrice: string; // string in the form; base_price column is numeric
  flight_option: FlightOption;
  addons: PackageAddonForm[];
  inclusions: {
    accommodation: InclusionCategory;
    meals: InclusionCategory;
    transportation: InclusionCategory;
    activities: InclusionCategory;
    guides: InclusionCategory;
    insurance: InclusionCategory;
    other: InclusionCategory;
  };
  additionalInclusions: string[];
  exclusions: string[];
  inclusions_ar: string[];
  exclusions_ar: string[];
  cancellation_policy: string;
  terms_conditions: string;
  // step-only / not persisted:
  base_price?: number; // dead shadow of basePrice
  newInclusion?: string;
  newExclusion?: string;
  newInclusionAr?: string;
  newExclusionAr?: string;
}

export type HotelKind = 'hotel' | 'resort' | 'lodge' | 'guesthouse' | 'camp' | 'cruise' | 'apartment';

/**
 * An accommodation shown on the package's "Where You'll Stay" section. Authored
 * entirely by the agency (name typed, one image uploaded) — deliberately not
 * sourced from a hotel API, whose terms forbid storing name+photo. Following the
 * tour-operator convention the name carries its own hedge ("… or similar").
 */
export interface PackageHotel {
  id: string;              // client-side row key only; the DB row is replaced on save
  name: string;
  name_ar?: string;
  kind: HotelKind;
  room_type?: string;      // free text: "Deluxe Room", "Sea-view Suite"
  room_type_ar?: string;
  star_rating: number | null;
  day_numbers: number[];   // maps onto itineraries.day_number
  upgrade_available: boolean;
  image_path: string | null;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption: string;
  isPrimary: boolean;
  file_name?: string;
  file_path?: string;
}

export interface PackageFormData {
  basicInfo: PackageBasicInfo;
  route: RouteData;
  itinerary: ItineraryDay[];
  hotels: PackageHotel[];
  pricing: PackagePricing;
  media: MediaItem[];
}
