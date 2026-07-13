import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackageFormData } from "@/features/packages/types/wizard";
import { missingRequiredFields } from "@/features/packages/lib/wizardValidation";

export type SectionState = 'complete' | 'required' | 'optional';

export interface SectionInfo {
  step: number;
  titleKey: string;
  state: SectionState;
}

// Wave C sections. Required sections track the shared validation rules;
// Departures tracks live data (>=1 upcoming scheduled date = the submit gate);
// Media reads as done once it has content.
export function getSections(formData: PackageFormData, departuresOk: boolean): SectionInfo[] {
  return [
    { step: 1, titleKey: 'packageWizard.basicInformation', state: missingRequiredFields(1, formData).length ? 'required' : 'complete' },
    { step: 2, titleKey: 'packageWizard.thePlan', state: missingRequiredFields(2, formData).length ? 'required' : 'complete' },
    { step: 3, titleKey: 'packageWizard.pricingAndPolicies', state: missingRequiredFields(3, formData).length ? 'required' : 'complete' },
    { step: 4, titleKey: 'departures.title', state: departuresOk ? 'complete' : 'required' },
    { step: 5, titleKey: 'packageWizard.mediaAndPhotos', state: (formData.media || []).length ? 'complete' : 'optional' },
  ];
}

function StateIcon({ state }: { state: SectionState }) {
  if (state === 'complete') return <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden />;
  if (state === 'required') return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden />;
  return <Circle className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" aria-hidden />;
}

interface SectionNavProps {
  sections: SectionInfo[];
  currentStep: number;
  onSelect: (step: number) => void;
}

// Free navigation between sections; completion is communicated per item and
// the submit gate lives on the submit action, not on movement.
export function SectionNav({ sections, currentStep, onSelect }: SectionNavProps) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('packageWizard.sectionsNav', 'Package sections')}>
      <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {sections.map((section) => {
          const isCurrent = section.step === currentStep;
          return (
            <li key={section.step} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => onSelect(section.step)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-start transition-colors whitespace-nowrap lg:whitespace-normal",
                  isCurrent
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <StateIcon state={section.state} />
                <span className="flex-1">{t(section.titleKey)}</span>
                {section.state === 'optional' && !isCurrent && (
                  <span className="text-xs text-muted-foreground/70 hidden lg:inline">
                    {t('packageWizard.optionalSection', 'Optional')}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
