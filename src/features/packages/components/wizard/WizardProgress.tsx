
import { Progress } from "@/ui/progress";
import { Check } from "lucide-react";

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <div className="flex justify-between">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex flex-col items-center cursor-pointer transition-colors ${
              currentStep === step.id
                ? "text-primary"
                : currentStep > step.id
                ? "text-green-600"
                : "text-muted-foreground"
            }`}
            onClick={() => onStepClick(step.id)}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.id
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground"
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
    </div>
  );
}
