
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BasicInfoStep } from "./wizard-steps/BasicInfoStep";
import { ItineraryStep } from "./wizard-steps/ItineraryStep";
import { PricingStep } from "./wizard-steps/PricingStep";
import { MediaStep } from "./wizard-steps/MediaStep";
import { ReviewStep } from "./wizard-steps/ReviewStep";
import { usePackages } from "@/hooks/usePackages";
import { WizardHeader } from "@/components/travel_agency/packages/wizard/WizardHeader";
import { WizardProgressCard } from "@/components/travel_agency/packages/wizard/WizardProgressCard";
import { WizardNavigationButtons } from "@/components/travel_agency/packages/wizard/WizardNavigationButtons";
import { validateFormData } from "@/components/travel_agency/packages/wizard/WizardFormValidation";

const steps = [
  { id: 1, title: "Basic Info", description: "Package details and location" },
  { id: 2, title: "Itinerary", description: "Day-by-day activities" },
  { id: 3, title: "Pricing", description: "Costs and inclusions" },
  { id: 4, title: "Media", description: "Photos and videos" },
  { id: 5, title: "Review", description: "Final review and publish" }
];

interface FormData {
  basicInfo: {
    title?: string;
    description?: string;
    destination?: string;
    destinations?: string[];
    duration?: number;
    maxGroupSize?: number;
    difficulty?: string;
    packageType?: string;
    cities?: Array<{ name: string }>;
  };
  itinerary: any[];
  pricing: { 
    currency: string; 
    basePrice: string;
    inclusions?: any;
    exclusions?: any[];
  };
  media: any[];
  isPublished: boolean;
}

export default function PackageWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    basicInfo: {},
    itinerary: [],
    pricing: { currency: 'USD', basePrice: '' },
    media: [],
    isPublished: false
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { createPackage } = usePackages();

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const handleFormDataUpdate = (stepKey: keyof FormData, data: any) => {
    console.log(`Updating ${stepKey} with:`, data);
    setFormData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  };

  const handleCancel = () => {
    navigate("/travel_agency/packages");
  };

  const handleSaveDraft = async () => {
    if (!validateFormData(formData, setCurrentStep)) return;
    
    try {
      setSaving(true);
      console.log('Saving as draft with data:', formData);
      
      const draftData = { ...formData, isPublished: false };
      const result = await createPackage(draftData);
      
      console.log('Draft saved successfully:', result);
      toast.success("Package saved as draft successfully!");
      navigate("/travel_agency/packages");
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateFormData(formData, setCurrentStep)) return;
    
    try {
      setSaving(true);
      console.log('Publishing package with data:', formData);
      
      const publishData = { ...formData, isPublished: true };
      const result = await createPackage(publishData);
      
      console.log('Package published successfully:', result);
      toast.success("Package published successfully!");
      navigate("/travel_agency/packages");
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to publish package");
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={formData.basicInfo}
            onUpdate={(data) => handleFormDataUpdate('basicInfo', data)}
          />
        );
      case 2:
        return (
          <ItineraryStep
            data={formData.itinerary}
            onUpdate={(data) => handleFormDataUpdate('itinerary', data)}
          />
        );
      case 3:
        return (
          <PricingStep
            data={formData.pricing}
            onUpdate={(data) => handleFormDataUpdate('pricing', data)}
          />
        );
      case 4:
        return (
          <MediaStep
            data={formData.media}
            onUpdate={(data) => handleFormDataUpdate('media', data)}
          />
        );
      case 5:
        return (
          <ReviewStep
            data={formData}
            onUpdate={(data) => setFormData(data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <WizardHeader onCancel={handleCancel} saving={saving} />
      
      <WizardProgressCard 
        steps={steps}
        currentStep={currentStep}
        progress={progress}
        onStepClick={handleStepClick}
      />

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      <WizardNavigationButtons
        currentStep={currentStep}
        totalSteps={steps.length}
        saving={saving}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />
    </div>
  );
}
