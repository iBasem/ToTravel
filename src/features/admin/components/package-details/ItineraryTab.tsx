import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/ui/card';
import { EmptyState } from '@/ui/empty-state';
import { BedDouble, Bus, UtensilsCrossed } from 'lucide-react';
import { localizedText, pickLocalized } from '@/lib/localized';
import type { AdminItineraryDay } from '@/features/admin/hooks/useAdminPackageDetails';

interface ItineraryTabProps {
  itinerary: AdminItineraryDay[];
}

export function ItineraryTab({ itinerary }: ItineraryTabProps) {
  const { t } = useTranslation();

  if (itinerary.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title={t('adminPackageDetails.noItinerary', 'No itinerary')}
        description={t(
          'adminPackageDetails.noItineraryDesc',
          'This package has no day-by-day itinerary yet.',
        )}
      />
    );
  }

  return (
    <div className="relative space-y-4">
      {itinerary.map((day, index) => {
        const activities = pickLocalized<string[]>(day, 'activities') ?? [];
        const description = localizedText(day, 'description');
        return (
          <div key={day.id} className="flex gap-4">
            {/* Timeline rail */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {day.day_number}
              </div>
              {index < itinerary.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>

            <Card className="flex-1 mb-2">
              <CardContent className="p-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('adminPackageDetails.dayLabel', 'Day {{number}}', {
                      number: day.day_number,
                    })}
                  </span>
                  <h3 className="font-semibold">{localizedText(day, 'title')}</h3>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
                )}
                {activities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t('adminPackageDetails.activities', 'Activities')}
                    </p>
                    <ul className="list-disc ms-5 space-y-0.5 text-sm">
                      {activities.map((activity, i) => (
                        <li key={i}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  {day.accommodation && (
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4" aria-hidden="true" />
                      {day.accommodation}
                    </span>
                  )}
                  {day.transportation && (
                    <span className="flex items-center gap-1.5">
                      <Bus className="w-4 h-4" aria-hidden="true" />
                      {day.transportation}
                    </span>
                  )}
                  {day.meals_included && day.meals_included.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
                      {day.meals_included.join(', ')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
