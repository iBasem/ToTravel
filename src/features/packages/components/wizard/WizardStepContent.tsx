import { useTranslation } from "react-i18next";
import { BasicInfoStep } from "@/features/packages/components/wizard-steps/BasicInfoStep";
import { PlanStep } from "@/features/packages/components/wizard-steps/PlanStep";
import { StaysStep } from "@/features/packages/components/wizard-steps/StaysStep";
import { PricingStep } from "@/features/packages/components/wizard-steps/PricingStep";
import { MediaStep } from "@/features/packages/components/wizard-steps/MediaStep";
import { DeparturesEditor } from "@/features/packages/components/editor/DeparturesEditor";
import { CalendarDays } from "lucide-react";
import type { PackageFormData } from "@/features/packages/types/wizard";

// Editor sections: 1 Basics · 2 Plan (route + day program) · 3 Stays ·
// 4 Pricing · 5 Departures (tour start dates) · 6 Media. The old Review step is
// replaced by the persistent checklist in the editor chrome.
interface WizardStepContentProps {
  currentStep: number;
  formData: PackageFormData;
  onUpdate: <K extends keyof PackageFormData>(stepKey: K, data: PackageFormData[K]) => void;
  onFormDataUpdate: (data: PackageFormData) => void;
  // Departures need a saved package row; null until autosave creates one.
  packageId: string | null;
  onDeparturesChanged?: () => void;
}

export function WizardStepContent({
  currentStep,
  formData,
  onUpdate,
  onFormDataUpdate,
  packageId,
  onDeparturesChanged
}: WizardStepContentProps) {
  const { t } = useTranslation();

  switch (currentStep) {
    case 1:
      return (
        <BasicInfoStep
          data={formData.basicInfo}
          onUpdate={(data) => onUpdate('basicInfo', data)}
        />
      );
    case 2:
      return (
        <PlanStep
          formData={formData}
          onUpdate={onFormDataUpdate}
        />
      );
    case 3:
      return (
        <StaysStep
          data={formData.hotels}
          itinerary={formData.itinerary}
          onUpdate={(data) => onUpdate('hotels', data)}
        />
      );
    case 4:
      return (
        <PricingStep
          data={formData.pricing}
          onUpdate={(data) => onUpdate('pricing', data)}
        />
      );
    case 5:
      if (!packageId) {
        return (
          <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('packageWizard.departuresNeedDraft', 'Complete the basics first — autosave will create your draft, then you can add departure dates here.')}
            </p>
          </div>
        );
      }
      return <DeparturesEditor packageId={packageId} onChanged={onDeparturesChanged} />;
    case 6:
      return (
        <MediaStep
          data={formData.media}
          onUpdate={(data) => onUpdate('media', data)}
        />
      );
    default:
      return null;
  }
}
