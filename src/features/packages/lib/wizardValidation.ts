import type { PackageFormData } from "@/features/packages/types/wizard";

// Required-field rules for the two gated wizard steps (1: basics, 4: pricing),
// shared by the create dialog and the edit page so the gates can't drift.
// Returns the i18n label keys of missing fields; empty array = step passes.
export function missingRequiredFields(step: number, formData: PackageFormData): string[] {
  const missing: string[] = [];

  if (step === 1) {
    const b = formData.basicInfo;
    // Support both the destinations array (create flow) and the legacy scalar.
    const hasDestination =
      (b.destinations && b.destinations.length > 0) || !!b.destination;
    if (!b.title?.trim()) missing.push("packageWizard.packageTitle");
    if (!hasDestination) missing.push("packageWizard.destination");
    if (!b.category) missing.push("packageWizard.category");
    if (!(b.duration_days > 0)) missing.push("packageWizard.durationDays");
    if (!b.description?.trim()) missing.push("packageWizard.description");
  }

  if (step === 4) {
    if (!(parseFloat(formData.pricing.basePrice) > 0)) {
      missing.push("packageWizard.basePrice");
    }
  }

  return missing;
}
