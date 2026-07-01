
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onPublish: () => void;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onClose,
  onPublish
}: WizardNavigationProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t('common.previous')}
      </Button>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('packageWizard.saveAsDraft')}
        </Button>
        {currentStep < totalSteps ? (
          <Button onClick={onNext} className="flex items-center gap-2">
            {t('common.next')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Button>
        ) : (
          <Button onClick={onPublish} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {t('packageWizard.publishPackage')}
          </Button>
        )}
      </div>
    </div>
  );
}
