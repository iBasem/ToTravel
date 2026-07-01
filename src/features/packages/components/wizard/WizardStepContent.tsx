import { BasicInfoStep } from "@/features/packages/components/wizard-steps/BasicInfoStep";
import { RouteStep } from "@/features/packages/components/wizard-steps/RouteStep";
import { ItineraryStep } from "@/features/packages/components/wizard-steps/ItineraryStep";
import { PricingStep } from "@/features/packages/components/wizard-steps/PricingStep";
import { MediaStep } from "@/features/packages/components/wizard-steps/MediaStep";
import { ReviewStep } from "@/features/packages/components/wizard-steps/ReviewStep";

interface WizardStepContentProps {
  currentStep: number;
  formData: any;
  onUpdate: (stepKey: string, data: any) => void;
  onFormDataUpdate: (data: any) => void;
}

export function WizardStepContent({
  currentStep,
  formData,
  onUpdate,
  onFormDataUpdate
}: WizardStepContentProps) {
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
        <RouteStep
          data={formData.route}
          onUpdate={(data) => onUpdate('route', data)}
        />
      );
    case 3:
      return (
        <ItineraryStep
          data={formData.itinerary}
          onUpdate={(data) => onUpdate('itinerary', data)}
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
      return (
        <MediaStep
          data={formData.media}
          onUpdate={(data) => onUpdate('media', data)}
        />
      );
    case 6:
      return (
        <ReviewStep
          data={formData}
          onUpdate={onFormDataUpdate}
        />
      );
    default:
      return null;
  }
}
