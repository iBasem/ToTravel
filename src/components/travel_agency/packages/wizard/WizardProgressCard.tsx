
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardProgressCardProps {
  steps: Step[];
  currentStep: number;
  progress: number;
  onStepClick: (stepId: number) => void;
}

export function WizardProgressCard({ steps, currentStep, progress, onStepClick }: WizardProgressCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Card>
      <CardContent className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mb-4">
          <div className={`flex justify-between items-center mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-medium text-gray-700">
              {t('packageWizard.step')} {currentStep} {t('packageWizard.of')} {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% {t('packageWizard.complete')}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center cursor-pointer transition-colors ${
                currentStep === step.id
                  ? "text-blue-600"
                  : currentStep > step.id
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
              onClick={() => onStepClick(step.id)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  currentStep === step.id
                    ? "bg-blue-600 text-white"
                    : currentStep > step.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-xs">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
