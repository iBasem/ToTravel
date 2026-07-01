
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
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
  const { t } = useTranslation();

  return (
    <div className="flex justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1 || saving}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t('common.previous')}
      </Button>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          {t('packageWizard.saveAsDraft')}
        </Button>
        {currentStep < totalSteps ? (
          <Button onClick={onNext} disabled={saving} className="flex items-center gap-2">
            {t('common.next')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Button>
        ) : (
          <Button
            onClick={onPublish}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {t('packageWizard.publishPackage')}
          </Button>
        )}
      </div>
    </div>
  );
}
