
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WizardStepContent } from "@/components/packages/wizard/WizardStepContent";
import { useCreatePackage } from "@/hooks/useCreatePackage";

interface PackageWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PackageWizard({ isOpen, onClose }: PackageWizardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    basicInfo: {
      title: '',
      description: '',
      destination: '',
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
      currency: "USD",
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
      cancellation_policy: '',
      terms_conditions: ''
    },
    media: []
  });

  const { createPackage, loading } = useCreatePackage();

  console.log('PackageWizard - Current step:', currentStep, 'Form data:', formData);

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (stepKey: string, data: any) => {
    console.log(`Updating ${stepKey} with:`, data);
    setFormData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  };

  const handleFormDataUpdate = (data: any) => {
    console.log('Full form data update:', data);
    setFormData(data);
  };

  const nextStep = () => {
    console.log('Next step clicked, current step:', currentStep, 'Valid:', isStepValid(currentStep));
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    console.log('Previous step clicked, current step:', currentStep);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('Submit clicked, form data:', formData);
    
    const transformedData = {
      basicInfo: formData.basicInfo,
      itinerary: formData.itinerary,
      pricing: {
        base_price: parseFloat(formData.pricing.basePrice) || 0,
        inclusions: [],
        exclusions: formData.pricing.exclusions || [],
        cancellation_policy: formData.pricing.cancellation_policy || '',
        terms_conditions: formData.pricing.terms_conditions || ''
      },
      media: formData.media
    };

    if (formData.pricing.inclusions) {
      Object.entries(formData.pricing.inclusions).forEach(([key, value]: [string, any]) => {
        if (value?.included && value?.details) {
          transformedData.pricing.inclusions.push(...value.details);
        }
      });
      
      if (formData.pricing.additionalInclusions && Array.isArray(formData.pricing.additionalInclusions)) {
        transformedData.pricing.inclusions.push(...formData.pricing.additionalInclusions);
      }
    }

    console.log('Transformed data for submission:', transformedData);

    try {
      const result = await createPackage(transformedData);
      console.log('Package creation result:', result);
      
      if (result.success) {
        onClose();
        setCurrentStep(1);
        setFormData({
          basicInfo: {
            title: '',
            description: '',
            destination: '',
            destinations: [],
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
            currency: "USD",
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
            cancellation_policy: '',
            terms_conditions: ''
          },
          media: []
        });
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

  const isStepValid = (step: number) => {
    console.log(`Validating step ${step}`);
    
    switch (step) {
      case 1:
        // Support both destinations array and legacy destination field
        const hasDestination = (formData.basicInfo.destinations && formData.basicInfo.destinations.length > 0) || 
                               formData.basicInfo.destination;
        const basicInfoValid = !!(formData.basicInfo.title && 
                 hasDestination && 
                 formData.basicInfo.category && 
                 formData.basicInfo.duration_days > 0);
        console.log('Step 1 validation:', {
          title: formData.basicInfo.title,
          destinations: formData.basicInfo.destinations,
          destination: formData.basicInfo.destination,
          category: formData.basicInfo.category,
          duration: formData.basicInfo.duration_days,
          valid: basicInfoValid
        });
        return basicInfoValid;
      case 2:
        console.log('Step 2 validation: true (route is optional)');
        return true;
      case 3:
        console.log('Step 3 validation: true (itinerary is optional)');
        return true;
      case 4:
        const pricingValid = !!(formData.pricing.basePrice && parseFloat(formData.pricing.basePrice) > 0);
        console.log('Step 4 validation:', {
          basePrice: formData.pricing.basePrice,
          parsed: parseFloat(formData.pricing.basePrice),
          valid: pricingValid
        });
        return pricingValid;
      case 5:
        console.log('Step 5 validation: true (media is optional)');
        return true;
      case 6:
        console.log('Step 6 validation: true');
        return true;
      default:
        console.log('Unknown step validation: false');
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t('packageWizard.createNewPackage')} - {getStepTitle(currentStep)}
          </DialogTitle>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t('packageWizard.stepOf', { current: currentStep, total: totalSteps })}</span>
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

        <div className={`flex justify-between pt-4 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            {t('common.previous')}
          </Button>

          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            
            {currentStep === totalSteps ? (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !isStepValid(currentStep)}
              >
                {loading ? t('packageWizard.creating') : t('packageWizard.createPackage')}
              </Button>
            ) : (
              <Button 
                onClick={nextStep} 
                disabled={!isStepValid(currentStep)}
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
