
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

interface WizardNavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function WizardNavigationButtons({
  currentStep,
  totalSteps,
  saving,
  onPrevious,
  onNext,
  onSaveDraft,
  onPublish
}: WizardNavigationButtonsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1 || saving}
      >
        {isRTL ? (
          <ArrowRight className="w-4 h-4 ml-2" />
        ) : (
          <ArrowLeft className="w-4 h-4 mr-2" />
        )}
        {t('common.previous')}
      </Button>

      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button 
          variant="outline" 
          onClick={onSaveDraft}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
          ) : null}
          {t('packageWizard.saveAsDraft')}
        </Button>
        {currentStep < totalSteps ? (
          <Button onClick={onNext} disabled={saving}>
            {t('common.next')}
            {isRTL ? (
              <ArrowLeft className="w-4 h-4 mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        ) : (
          <Button 
            onClick={onPublish} 
            className="bg-green-600 hover:bg-green-700"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
            ) : (
              <Check className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            )}
            {t('packageWizard.publishPackage')}
          </Button>
        )}
      </div>
    </div>
  );
}
