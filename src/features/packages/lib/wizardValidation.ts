import type { PackageFormData } from "@/features/packages/types/wizard";

// Required-field rules per editor section, shared by the editor's gates,
// the section nav, and the checklist so they can't drift.
//
// Sections: 1 Basics · 2 Plan (route + itinerary) · 3 Stays (optional) ·
// 4 Pricing · 5 Departures (validated against live departures, not form state) ·
// 6 Media. Only 1/2/4 carry required rules — keep missingForSubmit in sync.
// Returns the i18n label keys of missing fields; empty array = section passes.
export function missingRequiredFields(step: number, formData: PackageFormData): string[] {
  const missing: string[] = [];

  if (step === 1) {
    const b = formData.basicInfo;
    if (!b.title?.trim()) missing.push("packageWizard.packageTitle");
    if (!b.category) missing.push("packageWizard.category");
    if (!b.description?.trim()) missing.push("packageWizard.description");
  }

  if (step === 2) {
    // Destination truth lives in the route stops; the legacy scalar keeps
    // pre-Wave-C packages (created before stops were required) valid.
    const hasDestination =
      (formData.route?.destinations?.length ?? 0) > 0 || !!formData.basicInfo.destination;
    if (!hasDestination) missing.push("packageWizard.destination");
  }

  // Step 3 (Stays) is optional and has no required rule.

  if (step === 4) {
    if (!(parseFloat(formData.pricing.basePrice) > 0)) {
      missing.push("packageWizard.basePrice");
    }
  }

  return missing;
}

// Everything the submit-for-review action requires from the form itself
// (the >=1 upcoming departure gate is checked against live data separately).
export function missingForSubmit(formData: PackageFormData): string[] {
  // 3 (Stays) and 6 (Media) are optional; 5 (Departures) is gated on live data.
  return [1, 2, 4].flatMap((step) => missingRequiredFields(step, formData));
}
