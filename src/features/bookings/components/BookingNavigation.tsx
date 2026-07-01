
import { Button } from '@/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BookingNavigationProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  isLastStep: boolean;
}

export function BookingNavigation({ currentStep, onNext, onPrevious, isLastStep }: BookingNavigationProps) {
  const { t } = useTranslation();

  if (isLastStep) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
      {/* Previous button */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="w-full sm:w-auto flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4 rtl-flip" />
        {t('common.previous')}
      </Button>

      {/* Next button */}
      <Button
        onClick={onNext}
        className="w-full sm:w-auto flex items-center gap-2"
      >
        {t('common.next')}
        <ChevronRight className="w-4 h-4 rtl-flip" />
      </Button>
    </div>
  );
}
