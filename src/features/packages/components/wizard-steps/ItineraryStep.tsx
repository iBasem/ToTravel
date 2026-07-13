
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Checkbox } from "@/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import { Plus, Trash2, Utensils, Bed, Activity, ChevronRight, ChevronDown, X, Languages, CalendarDays } from "lucide-react";
import type { ItineraryDay } from "@/features/packages/types/wizard";

interface ItineraryStepProps {
  data: ItineraryDay[];
  onUpdate: (data: ItineraryDay[]) => void;
}

const emptyDay = (day: number): ItineraryDay => ({
  day,
  title: "",
  description: "",
  activities: [],
  meals: [],
  accommodation: "",
  title_ar: "",
  description_ar: "",
  activities_ar: []
});

// Controlled section: the itinerary lives in the shared form state; only the
// per-day "add activity" scratch inputs are local UI state.
export function ItineraryStep({ data, onUpdate }: ItineraryStepProps) {
  const { t, i18n } = useTranslation();

  const itinerary = data || [];
  const [newActivity, setNewActivity] = useState<Record<number, string>>({});
  const [newActivityAr, setNewActivityAr] = useState<Record<number, string>>({});

  const addDay = () => {
    onUpdate([...itinerary, emptyDay(itinerary.length + 1)]);
  };

  const removeDay = (dayIndex: number) => {
    onUpdate(
      itinerary
        .filter((_, index) => index !== dayIndex)
        .map((day, index) => ({ ...day, day: index + 1 }))
    );
  };

  const updateDay = <K extends keyof ItineraryDay>(dayIndex: number, field: K, value: ItineraryDay[K]) => {
    onUpdate(itinerary.map((day, index) =>
      index === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const addActivity = (dayIndex: number) => {
    const pending = (newActivity[dayIndex] || "").trim();
    if (!pending) return;
    const day = itinerary[dayIndex];
    updateDay(dayIndex, "activities", [...day.activities.filter(a => a.trim()), pending]);
    setNewActivity(prev => ({ ...prev, [dayIndex]: "" }));
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const day = itinerary[dayIndex];
    updateDay(dayIndex, "activities", day.activities.filter((_, i) => i !== activityIndex));
  };

  const addActivityAr = (dayIndex: number) => {
    const pending = (newActivityAr[dayIndex] || "").trim();
    if (!pending) return;
    const day = itinerary[dayIndex];
    updateDay(dayIndex, "activities_ar", [...day.activities_ar.filter(a => a.trim()), pending]);
    setNewActivityAr(prev => ({ ...prev, [dayIndex]: "" }));
  };

  const removeActivityAr = (dayIndex: number, activityIndex: number) => {
    const day = itinerary[dayIndex];
    updateDay(dayIndex, "activities_ar", day.activities_ar.filter((_, i) => i !== activityIndex));
  };

  const toggleMeal = (dayIndex: number, meal: string) => {
    const day = itinerary[dayIndex];
    updateDay(
      dayIndex,
      "meals",
      day.meals.includes(meal) ? day.meals.filter(m => m !== meal) : [...day.meals, meal]
    );
  };

  const mealOptions = [
    { key: "Breakfast", label: t('packageWizard.breakfast') },
    { key: "Lunch", label: t('packageWizard.lunch') },
    { key: "Dinner", label: t('packageWizard.dinner') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-start">
          <h3 className="text-lg font-semibold">{t('packageWizard.dailyItinerary')}</h3>
          <p className="text-muted-foreground">{t('packageWizard.dailyItineraryDesc')}</p>
        </div>
        <Button onClick={addDay} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('packageWizard.addDay')}
        </Button>
      </div>

      {itinerary.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            {t('packageWizard.dailyItineraryDesc')}
          </p>
          <Button type="button" variant="outline" onClick={addDay}>
            <Plus className="w-4 h-4 me-2" />
            {t('packageWizard.addFirstDay', 'Add your first day')}
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {itinerary.map((day, dayIndex) => (
          <Card key={dayIndex}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-semibold text-primary">{i18n.language === 'ar' ? `ي${day.day}` : `D${day.day}`}</span>
                </div>
                <div className="flex-1">
                  <Input
                    value={day.title}
                    onChange={(e) => updateDay(dayIndex, "title", e.target.value)}
                    placeholder={t('packageWizard.dayTitlePlaceholder')}
                    className="font-medium text-lg border-none px-0 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDay(dayIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Label className="text-start block">{t('packageWizard.dayDescription')}</Label>
                <Textarea
                  value={day.description}
                  onChange={(e) => updateDay(dayIndex, "description", e.target.value)}
                  placeholder={t('packageWizard.dayDescriptionPlaceholder')}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activities */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <Label className="font-medium">{t('packageWizard.activities')}</Label>
                  </div>

                  <div className="space-y-2">
                    {day.activities.filter(a => a.trim()).map((activity, activityIndex) => (
                      <div key={activityIndex} className="flex items-start gap-2 p-2 bg-muted rounded text-start">
                        <ChevronRight className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0 rtl:rotate-180" />
                        <span className="text-sm flex-1">{activity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(dayIndex, activityIndex)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newActivity[dayIndex] || ""}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, [dayIndex]: e.target.value }))}
                      placeholder={t('packageWizard.addNewActivity')}
                      onKeyPress={(e) => e.key === "Enter" && addActivity(dayIndex)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addActivity(dayIndex)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Accommodation */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-primary" />
                    <Label className="font-medium">{t('packageWizard.accommodation')}</Label>
                  </div>
                  <Input
                    value={day.accommodation}
                    onChange={(e) => updateDay(dayIndex, "accommodation", e.target.value)}
                    placeholder={t('packageWizard.accommodationPlaceholder')}
                  />
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-600" />
                  <Label className="font-medium">{t('packageWizard.mealsIncluded')}</Label>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {mealOptions.map((meal) => (
                    <div key={meal.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`${dayIndex}-${meal.key}`}
                        checked={day.meals.includes(meal.key)}
                        onCheckedChange={() => toggleMeal(dayIndex, meal.key)}
                      />
                      <Label htmlFor={`${dayIndex}-${meal.key}`} className="text-sm cursor-pointer">
                        {meal.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {day.meals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {day.meals.map((meal, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        {mealOptions.find(m => m.key === meal)?.label || meal}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Arabic Content */}
              <Collapsible className="border rounded-md">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-muted-foreground" />
                      {t('packageWizard.arabicContent', 'Arabic content (optional)')}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 space-y-4">
                  <p className="text-sm text-muted-foreground text-start">
                    {t('packageWizard.arabicContentHint', 'Shown to Arabic-speaking travelers; English is used when empty')}
                  </p>

                  <div className="space-y-2">
                    <Label className="text-start block">{t('packageWizard.titleAr', 'Title (Arabic)')}</Label>
                    <Input
                      dir="rtl"
                      value={day.title_ar}
                      onChange={(e) => updateDay(dayIndex, "title_ar", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-start block">{t('packageWizard.descriptionAr', 'Description (Arabic)')}</Label>
                    <Textarea
                      dir="rtl"
                      value={day.description_ar}
                      onChange={(e) => updateDay(dayIndex, "description_ar", e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-start block">{t('packageWizard.activitiesAr', 'Activities (Arabic)')}</Label>

                    <div className="space-y-2">
                      {day.activities_ar.filter(a => a.trim()).map((activity, activityIndex) => (
                        <div key={activityIndex} className="flex items-start gap-2 p-2 bg-muted rounded text-start" dir="rtl">
                          <ChevronRight className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0 rotate-180" />
                          <span className="text-sm flex-1">{activity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeActivityAr(dayIndex, activityIndex)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        dir="rtl"
                        value={newActivityAr[dayIndex] || ""}
                        onChange={(e) => setNewActivityAr(prev => ({ ...prev, [dayIndex]: e.target.value }))}
                        onKeyPress={(e) => e.key === "Enter" && addActivityAr(dayIndex)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addActivityAr(dayIndex)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
