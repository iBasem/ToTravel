
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BookingNavigationProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  isLastStep: boolean;
}

export function BookingNavigation({ currentStep, onNext, onPrevious, isLastStep }: BookingNavigationProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  if (isLastStep) return null;

  // RTL: Previous on right, Next on left (flow right → left)
  // LTR: Previous on left, Next on right (flow left → right)
  return (
    <div className={`flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
      {/* Previous button */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`w-full sm:w-auto flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        {t('common.previous')}
      </Button>
      
      {/* Next button */}
      <Button 
        onClick={onNext} 
        className={`w-full sm:w-auto flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        {t('common.next')}
        <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  );
}
