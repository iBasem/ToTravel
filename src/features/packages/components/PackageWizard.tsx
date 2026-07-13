
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { WizardStepContent } from "@/features/packages/components/wizard/WizardStepContent";
import { useCreatePackage } from "@/features/packages/hooks/useCreatePackage";
import { buildSavePackagePayload } from "@/features/packages/lib/savePackagePayload";
import { missingRequiredFields } from "@/features/packages/lib/wizardValidation";
import type { PackageFormData } from "@/features/packages/types/wizard";

interface PackageWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const createInitialFormData = (): PackageFormData => ({
  basicInfo: {
    title: '',
    description: '',
    destination: '',
    title_ar: '',
    description_ar: '',
    destination_ar: '',
    destinations: [] as string[],
    category: '',
    difficulty_level: 'moderate',
    duration_days: 1,
    duration_nights: 0,
    max_participants: 20,
    featured: false
  },
  route: {
    destinations: [],
    travelMode: 'driving',
    showDistances: true
  },
  itinerary: [],
  pricing: {
    basePrice: "",
    base_price: 0,
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

export function PackageWizard({ isOpen, onClose }: PackageWizardProps) {
  const { t, i18n } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PackageFormData>(createInitialFormData);

  const { createPackage, loading } = useCreatePackage();

  // Dirty = what would be saved differs from a pristine form. Comparing via
  // the save payload ignores transient step-only fields (newHighlight, etc.).
  const pristinePayload = useMemo(
    () => JSON.stringify(buildSavePackagePayload(createInitialFormData())),
    []
  );
  const isDirty = JSON.stringify(buildSavePackagePayload(formData)) !== pristinePayload;

  const handleClose = () => {
    if (isDirty && !window.confirm(t('packageWizard.unsavedChangesConfirm'))) {
      return;
    }
    onClose();
  };

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = <K extends keyof PackageFormData>(stepKey: K, data: PackageFormData[K]) => {
    // Bail out on identical references: steps re-push their state from a
    // useEffect on every render, and returning prev stops the update loop.
    setFormData(prev => (prev[stepKey] === data ? prev : { ...prev, [stepKey]: data }));
  };

  const handleFormDataUpdate = (data: PackageFormData) => {
    setFormData(data);
  };

  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // The save_package RPC does the full multi-table write atomically.
      const result = await createPackage(formData, !!formData.isPublished);

      if (result.success) {
        onClose();
        setCurrentStep(1);
        setFormData(createInitialFormData());
      }
    } catch (error) {
      console.error('Package creation failed:', error);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return t('packageWizard.basicInformation');
      case 2: return t('packageWizard.tourRoute', 'Tour Route');
      case 3: return t('packageWizard.itinerary');
      case 4: return t('packageWizard.pricingAndPolicies');
      case 5: return t('packageWizard.mediaAndPhotos');
      case 6: return t('packageWizard.reviewAndPublish');
      default: return "";
    }
  };

  // Steps 2/3/5/6 are optional; 1 and 4 gate on the shared required-field rules.
  const missingFields = missingRequiredFields(currentStep, formData);
  const isStepValid = (step: number) =>
    step >= 1 && step <= 6 && missingRequiredFields(step, formData).length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-start">
          <DialogTitle className="text-2xl font-bold">
            {t('packageWizard.createNewPackage')} - {getStepTitle(currentStep)}
          </DialogTitle>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t('packageWizard.step')} {currentStep} {t('packageWizard.of')} {totalSteps}</span>
              <span>{Math.round(progress)}% {t('packageWizard.complete')}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </DialogHeader>

        <div className="mb-6">
          <WizardStepContent
            currentStep={currentStep}
            formData={formData}
            onUpdate={updateFormData}
            onFormDataUpdate={handleFormDataUpdate}
          />
        </div>

        {missingFields.length > 0 && (
          <p className="text-sm text-muted-foreground text-start" role="status">
            {t('packageWizard.missingRequired', {
              fields: missingFields.map((key) => t(key)).join(i18n.language === 'ar' ? '، ' : ', ')
            })}
          </p>
        )}

        {/*
         * RTL Wizard Navigation:
         * - Previous action on the RIGHT (going back = going right in RTL)
         * - Next action on the LEFT (going forward = going left in RTL)
         */}
        <div className="flex justify-between pt-4 border-t">
          {/* Previous button */}
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            {t('common.previous')}
          </Button>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={loading || !isStepValid(currentStep)}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? t('packageWizard.creating') : t('packageWizard.createPackage')}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="bg-primary hover:bg-primary/90"
              >
                {t('common.next')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
