
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Previous button - on the RIGHT in RTL (going back = going right) */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        {t('common.previous')}
      </Button>

      {/* Action buttons - on the LEFT in RTL (going forward = going left) */}
      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button variant="outline" onClick={onClose}>
          {t('packageWizard.saveAsDraft')}
        </Button>
        {currentStep < totalSteps ? (
          <Button onClick={onNext} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {t('common.next')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
        ) : (
          <Button onClick={onPublish} className={`bg-green-600 hover:bg-green-700 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Check className="w-4 h-4" />
            {t('packageWizard.publishPackage')}
          </Button>
        )}
      </div>
    </div>
  );
}
