
import { Progress } from '@/ui/progress';
import { useTranslation } from 'react-i18next';

interface BookingProgressBarProps {
  currentStep: number;
}

export function BookingProgressBar({ currentStep }: BookingProgressBarProps) {
  const { t } = useTranslation();

  const STEPS = [
    { id: 1, title: t('booking.travelDetails'), description: t('booking.selectDatesAndTravelers') },
    { id: 2, title: t('booking.travelerInfo'), description: t('booking.personalInformation') },
    { id: 3, title: t('booking.addOns'), description: t('booking.additionalServices') },
    { id: 4, title: t('booking.reviewAndBook'), description: t('booking.confirmAndPay') },
  ];

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex justify-between mb-2">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex flex-col items-center ${
              currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1 text-xs sm:text-sm ${
                currentStep >= step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step.id}
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-center">
              <div className="hidden sm:block">{step.title}</div>
              <div className="sm:hidden">{step.title.split(' ')[0]}</div>
              <div className="text-gray-500 hidden lg:block">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
      <Progress value={progress} className="h-1 sm:h-2" />
    </div>
  );
}
