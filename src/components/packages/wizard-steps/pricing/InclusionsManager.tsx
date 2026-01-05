
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Bed, Utensils, Car, Shield } from "lucide-react";

interface InclusionsManagerProps {
  inclusions: any;
  onToggle: (category: string, checked: boolean) => void;
  onAddDetail: (category: string, detail: string) => void;
  onRemoveDetail: (category: string, index: number) => void;
}

export function InclusionsManager({ inclusions, onToggle, onAddDetail, onRemoveDetail }: InclusionsManagerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const inclusionCategories = [
    { key: 'accommodation', label: t('packageWizard.accommodation'), icon: Bed },
    { key: 'meals', label: t('packageWizard.meals'), icon: Utensils },
    { key: 'transportation', label: t('packageWizard.transportation'), icon: Car },
    { key: 'activities', label: t('packageWizard.activitiesAndTours'), icon: Shield },
    { key: 'guides', label: t('packageWizard.professionalGuides'), icon: Shield },
    { key: 'insurance', label: t('packageWizard.travelInsurance'), icon: Shield },
    { key: 'other', label: t('packageWizard.otherServices'), icon: Shield }
  ];

  const presetOptions: Record<string, { key: string; label: string }[]> = {
    meals: [
      { key: 'Breakfast', label: t('packageWizard.breakfast') },
      { key: 'Lunch', label: t('packageWizard.lunch') },
      { key: 'Dinner', label: t('packageWizard.dinner') },
      { key: 'Snacks', label: t('packageWizard.snacks') },
      { key: 'Welcome Dinner', label: t('packageWizard.welcomeDinner') },
      { key: 'Farewell Dinner', label: t('packageWizard.farewellDinner') }
    ],
    accommodation: [
      { key: 'Hotels', label: t('packageWizard.hotels') },
      { key: 'Resorts', label: t('packageWizard.resorts') },
      { key: 'Guesthouses', label: t('packageWizard.guesthouses') },
      { key: 'Homestays', label: t('packageWizard.homestays') },
      { key: 'Cruise Ships', label: t('packageWizard.cruiseShips') }
    ],
    transportation: [
      { key: 'Airport Transfers', label: t('packageWizard.airportTransfers') },
      { key: 'Domestic Flights', label: t('packageWizard.domesticFlights') },
      { key: 'Private Vehicle', label: t('packageWizard.privateVehicle') },
      { key: 'Public Transport', label: t('packageWizard.publicTransport') },
      { key: 'Boat/Ferry', label: t('packageWizard.boatFerry') }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : 'text-left'}>{t('packageWizard.whatsIncluded')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {inclusionCategories.map(({ key, label, icon: Icon }) => (
          <div key={key} className="space-y-3">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Checkbox
                id={key}
                checked={inclusions[key]?.included || false}
                onCheckedChange={(checked) => onToggle(key, checked as boolean)}
              />
              <Label htmlFor={key} className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Label>
            </div>

            {inclusions[key]?.included && (
              <div className={`space-y-2 ${isRTL ? 'mr-6' : 'ml-6'}`}>
                {presetOptions[key] && (
                  <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {presetOptions[key].map((option) => (
                      <Button
                        key={option.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onAddDetail(key, option.label)}
                        className={`text-xs ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        + {option.label}
                      </Button>
                    ))}
                  </div>
                )}

                <div className={`flex flex-wrap gap-1 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {(inclusions[key]?.details || []).map((detail: string, index: number) => (
                    <Badge key={index} variant="secondary" className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {detail}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => onRemoveDetail(key, index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
