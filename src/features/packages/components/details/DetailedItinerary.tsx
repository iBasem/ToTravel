
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion";
import { Badge } from "@/ui/badge";
import { Calendar, Activity, ChevronRight, Utensils, Bed, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ItineraryItem {
  id: string;
  day_number: number;
  title: string;
  description: string;
  activities: string[];
  meals_included: string[];
  accommodation: string;
  transportation: string;
}

interface DetailedItineraryProps {
  itinerary: ItineraryItem[];
}

export function DetailedItinerary({ itinerary }: DetailedItineraryProps) {
  const { t, i18n } = useTranslation();

  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        {t('packageDetails.detailedItinerary', 'Detailed Itinerary')}
      </h3>
      <Accordion type="single" collapsible className="w-full">
        {itinerary.map((item, index) => (
          <AccordionItem key={item.id} value={`day-${item.day_number}`} className="border rounded-lg mb-3">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-4 text-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="font-semibold text-blue-600">
                    {i18n.language === 'ar' ? 'ي' : 'D'}{item.day_number}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 mt-4">
                {/* Activities */}
                {item.activities && item.activities.length > 0 && (
                  <div>
                    <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      {t('packageDetails.activities', 'Activities')}
                    </h5>
                    <ul className="space-y-1">
                      {item.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-start gap-2 text-sm text-foreground text-start">
                          <ChevronRight className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0 rtl:rotate-180" />
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Meals */}
                  {item.meals_included && item.meals_included.length > 0 && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-orange-600" />
                        {t('packageDetails.mealsIncluded', 'Meals Included')}
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {item.meals_included.map((meal, mealIndex) => (
                          <Badge key={mealIndex} variant="secondary" className="text-xs bg-orange-50 text-orange-700">
                            {meal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accommodation */}
                  {item.accommodation && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <Bed className="w-4 h-4 text-purple-600" />
                        {t('packageDetails.accommodation', 'Accommodation')}
                      </h5>
                      <p className="text-sm text-foreground text-start">{item.accommodation}</p>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
