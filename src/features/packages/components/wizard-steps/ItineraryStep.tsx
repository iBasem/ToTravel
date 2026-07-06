
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Checkbox } from "@/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import { Plus, Trash2, GripVertical, Utensils, Bed, Activity, Star, ChevronRight, ChevronDown, X, Languages } from "lucide-react";
import type { ItineraryDay } from "@/features/packages/types/wizard";

interface ItineraryStepProps {
  data: ItineraryDay[];
  onUpdate: (data: ItineraryDay[]) => void;
}

export function ItineraryStep({ data, onUpdate }: ItineraryStepProps) {
  const { t, i18n } = useTranslation();

  const [itinerary, setItinerary] = useState<ItineraryDay[]>(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item, index) => ({
        day: item.day || index + 1,
        title: item.title || "",
        description: item.description || "",
        activities: Array.isArray(item.activities) ? item.activities : [""],
        meals: Array.isArray(item.meals) ? item.meals : [],
        accommodation: item.accommodation || "",
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        title_ar: item.title_ar || "",
        description_ar: item.description_ar || "",
        activities_ar: Array.isArray(item.activities_ar) ? item.activities_ar : [],
        newActivity: "",
        newHighlight: "",
        newActivityAr: ""
      }));
    }
    return [
      {
        day: 1,
        title: "",
        description: "",
        activities: [""],
        meals: [],
        accommodation: "",
        highlights: [],
        title_ar: "",
        description_ar: "",
        activities_ar: [],
        newActivity: "",
        newHighlight: "",
        newActivityAr: ""
      }
    ];
  });

  useEffect(() => {
    onUpdate(itinerary);
  }, [itinerary, onUpdate]);

  const addDay = () => {
    const newDay: ItineraryDay = {
      day: itinerary.length + 1,
      title: "",
      description: "",
      activities: [""],
      meals: [],
      accommodation: "",
      highlights: [],
      title_ar: "",
      description_ar: "",
      activities_ar: [],
      newActivity: "",
      newHighlight: "",
      newActivityAr: ""
    };
    setItinerary([...itinerary, newDay]);
  };

  const removeDay = (dayIndex: number) => {
    const updatedItinerary = itinerary
      .filter((_, index) => index !== dayIndex)
      .map((day, index) => ({ ...day, day: index + 1 }));
    setItinerary(updatedItinerary);
  };

  const updateDay = <K extends keyof ItineraryDay>(dayIndex: number, field: K, value: ItineraryDay[K]) => {
    const updatedItinerary = itinerary.map((day, index) =>
      index === dayIndex ? { ...day, [field]: value } : day
    );
    setItinerary(updatedItinerary);
  };

  const addActivity = (dayIndex: number) => {
    const day = itinerary[dayIndex];
    if (day.newActivity.trim()) {
      const updatedItinerary = itinerary.map((d, index) =>
        index === dayIndex
          ? { ...d, activities: [...d.activities.filter(a => a.trim()), d.newActivity.trim()], newActivity: "" }
          : d
      );
      setItinerary(updatedItinerary);
    }
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const updatedItinerary = itinerary.map((day, index) =>
      index === dayIndex
        ? {
          ...day,
          activities: day.activities.filter((_, actIndex) => actIndex !== activityIndex)
        }
        : day
    );
    setItinerary(updatedItinerary);
  };

  const addHighlight = (dayIndex: number) => {
    const day = itinerary[dayIndex];
    if (day.newHighlight.trim()) {
      const updatedItinerary = itinerary.map((d, index) =>
        index === dayIndex
          ? { ...d, highlights: [...d.highlights, d.newHighlight.trim()], newHighlight: "" }
          : d
      );
      setItinerary(updatedItinerary);
    }
  };

  const removeHighlight = (dayIndex: number, highlightIndex: number) => {
    const updatedItinerary = itinerary.map((day, index) =>
      index === dayIndex
        ? {
          ...day,
          highlights: day.highlights.filter((_, hIndex) => hIndex !== highlightIndex)
        }
        : day
    );
    setItinerary(updatedItinerary);
  };

  const addActivityAr = (dayIndex: number) => {
    const day = itinerary[dayIndex];
    if (day.newActivityAr.trim()) {
      const updatedItinerary = itinerary.map((d, index) =>
        index === dayIndex
          ? { ...d, activities_ar: [...d.activities_ar.filter(a => a.trim()), d.newActivityAr.trim()], newActivityAr: "" }
          : d
      );
      setItinerary(updatedItinerary);
    }
  };

  const removeActivityAr = (dayIndex: number, activityIndex: number) => {
    const updatedItinerary = itinerary.map((day, index) =>
      index === dayIndex
        ? {
          ...day,
          activities_ar: day.activities_ar.filter((_, actIndex) => actIndex !== activityIndex)
        }
        : day
    );
    setItinerary(updatedItinerary);
  };

  const toggleMeal = (dayIndex: number, meal: string) => {
    const updatedItinerary = itinerary.map((day, index) =>
      index === dayIndex
        ? {
          ...day,
          meals: day.meals.includes(meal)
            ? day.meals.filter(m => m !== meal)
            : [...day.meals, meal]
        }
        : day
    );
    setItinerary(updatedItinerary);
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

      <div className="space-y-6">
        {itinerary.map((day, dayIndex) => (
          <Card key={dayIndex} className="border-s-4 border-s-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-semibold text-primary">{i18n.language === 'ar' ? `ي${day.day}` : `D${day.day}`}</span>
                </div>
                <div className="flex-1">
                  <Input
                    value={day.title}
                    onChange={(e) => updateDay(dayIndex, "title", e.target.value)}
                    placeholder={t('packageWizard.accommodationPlaceholder')}
                    className="font-medium text-lg border-none px-0 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                {itinerary.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDay(dayIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
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
                      value={day.newActivity}
                      onChange={(e) => updateDay(dayIndex, "newActivity", e.target.value)}
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
                    <Bed className="w-4 h-4 text-purple-600" />
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
                      <Badge key={index} variant="secondary" className="text-xs bg-orange-50 text-orange-700">
                        {mealOptions.find(m => m.key === meal)?.label || meal}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Day Highlights */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <Label className="font-medium">{t('packageWizard.dayHighlights')}</Label>
                </div>

                <div className="flex flex-wrap gap-1">
                  {day.highlights.map((highlight, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-yellow-200 text-yellow-700 flex items-center gap-1">
                      {highlight}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeHighlight(dayIndex, index)}
                      />
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={day.newHighlight}
                    onChange={(e) => updateDay(dayIndex, "newHighlight", e.target.value)}
                    placeholder={t('packageWizard.addDayHighlight')}
                    onKeyPress={(e) => e.key === "Enter" && addHighlight(dayIndex)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addHighlight(dayIndex)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
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
                        value={day.newActivityAr}
                        onChange={(e) => updateDay(dayIndex, "newActivityAr", e.target.value)}
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
