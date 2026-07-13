import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { RouteStep } from "@/features/packages/components/wizard-steps/RouteStep";
import { ItineraryStep } from "@/features/packages/components/wizard-steps/ItineraryStep";
import type { PackageFormData, ItineraryDay, RouteDestination, RouteData } from "@/features/packages/types/wizard";
import { AlertTriangle } from "lucide-react";

interface PlanStepProps {
  formData: PackageFormData;
  onUpdate: (data: PackageFormData) => void;
}

const emptyDay = (day: number, title: string): ItineraryDay => ({
  day,
  title,
  description: "",
  activities: [],
  meals: [],
  accommodation: "",
  title_ar: "",
  description_ar: "",
  activities_ar: []
});

// Stop roles are positional, not a manual choice: first = origin,
// last = destination, everything between = stop.
const withDerivedTypes = (stops: RouteDestination[]): RouteDestination[] =>
  stops.map((s, i) => ({
    ...s,
    order: i,
    type: i === 0 ? 'origin' : i === stops.length - 1 ? 'destination' : 'stop',
  }));

// One stop name per plan day, in route order ("Petra, Wadi Rum(2d)" ->
// [Petra, Wadi Rum, Wadi Rum]) — used to pre-label scaffolded day cards.
const dayStopNames = (stops: RouteDestination[]): string[] => {
  const names: string[] = [];
  for (const s of stops) {
    for (let i = 0; i < Math.max(1, s.daysSpent); i++) names.push(s.name);
  }
  return names;
};

const deriveDestination = (stops: RouteDestination[]): string =>
  [...new Set(stops.map((s) => s.name))].slice(0, 4).join(' · ');

// "The Plan" — route and day-by-day program as one module. Route stops
// scaffold the day cards; the display destination and the duration are
// derived from the plan (with manual override: once the user diverges,
// derivation stops overwriting their value and a mismatch warning shows).
export function PlanStep({ formData, onUpdate }: PlanStepProps) {
  const { t } = useTranslation();

  const planDays = formData.itinerary.length;
  const durationDays = formData.basicInfo.duration_days;

  // "Last derived" trackers: while the current value still equals what we
  // last derived, the user hasn't overridden it and we may keep syncing.
  const lastDerivedDest = useRef<string>(deriveDestination(formData.route.destinations));
  const lastDerivedDays = useRef<number>(durationDays);

  const syncDuration = (basicInfo: PackageFormData['basicInfo'], newPlanDays: number) => {
    if (newPlanDays > 0 && basicInfo.duration_days === lastDerivedDays.current) {
      if (basicInfo.duration_nights === Math.max(0, lastDerivedDays.current - 1)) {
        basicInfo.duration_nights = Math.max(0, newPlanDays - 1);
      }
      basicInfo.duration_days = newPlanDays;
      lastDerivedDays.current = newPlanDays;
    }
  };

  const handleRouteUpdate = (newRoute: RouteData) => {
    const stops = withDerivedTypes(newRoute.destinations);
    const targetDays = stops.reduce((sum, s) => sum + Math.max(1, s.daysSpent), 0);

    // Scaffold: append missing day cards, pre-labelled with the stop they
    // belong to. Never auto-remove days — user content wins.
    let itinerary = formData.itinerary;
    if (itinerary.length < targetDays) {
      const names = dayStopNames(stops);
      itinerary = [...itinerary];
      for (let day = itinerary.length + 1; day <= targetDays; day++) {
        itinerary.push(emptyDay(day, names[day - 1] || ""));
      }
    }

    const basicInfo = { ...formData.basicInfo };
    const derivedDest = deriveDestination(stops);
    if (!basicInfo.destination || basicInfo.destination === lastDerivedDest.current) {
      basicInfo.destination = derivedDest;
      basicInfo.destinations = [...new Set(stops.map((s) => s.name))];
    }
    lastDerivedDest.current = derivedDest;

    syncDuration(basicInfo, itinerary.length);

    onUpdate({
      ...formData,
      route: { ...newRoute, destinations: stops },
      itinerary,
      basicInfo,
    });
  };

  const handleItineraryUpdate = (newItinerary: ItineraryDay[]) => {
    const basicInfo = { ...formData.basicInfo };
    syncDuration(basicInfo, newItinerary.length);
    onUpdate({ ...formData, itinerary: newItinerary, basicInfo });
  };

  const applyDerivedDuration = () => {
    lastDerivedDays.current = planDays;
    onUpdate({
      ...formData,
      basicInfo: {
        ...formData.basicInfo,
        duration_days: planDays,
        duration_nights: Math.max(0, planDays - 1),
      },
    });
  };

  return (
    <div className="space-y-6">
      <RouteStep data={formData.route} onUpdate={handleRouteUpdate} />

      {planDays > 0 && durationDays !== planDays && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
          role="status"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden />
          <span className="flex-1 text-start">
            {t('packageWizard.durationMismatch', {
              plan: planDays,
              duration: durationDays,
            })}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={applyDerivedDuration}>
            {t('packageWizard.useDerivedDuration', { n: planDays })}
          </Button>
        </div>
      )}

      <ItineraryStep data={formData.itinerary} onUpdate={handleItineraryUpdate} />
    </div>
  );
}
