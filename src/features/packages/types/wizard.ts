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

export interface PackageBasicInfo {
  title: string;
  description: string;
  destination: string; // legacy scalar
  destinations: string[]; // authoritative list (create flow)
  title_ar: string;
  description_ar: string;
  destination_ar: string;
  category: string;
  difficulty_level: string;
  duration_days: number;
  duration_nights: number;
  max_participants: number;
  featured: boolean; // NOTE: agency should not self-feature (see gap analysis M1)
  // step-only / not persisted:
  subtitle?: string;
  highlights?: string[];
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
  highlights?: string[]; // not persisted
  title_ar: string;
  description_ar: string;
  activities_ar: string[];
  // transient add-item inputs:
  newActivity?: string;
  newHighlight?: string;
  newActivityAr?: string;
}

export interface PackagePricing {
  currency: string; // not persisted (no currency column)
  basePrice: string; // string in the form; base_price column is numeric
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
  originalPrice?: string;
  discount?: string;
  newInclusion?: string;
  newExclusion?: string;
  newInclusionAr?: string;
  newExclusionAr?: string;
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
  pricing: PackagePricing;
  media: MediaItem[];
  isPublished?: boolean; // set by ReviewStep; not yet wired to status (see gap analysis)
}
