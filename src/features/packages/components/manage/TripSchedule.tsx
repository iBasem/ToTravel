import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";
import { EmptyState } from "@/ui/empty-state";
import { pickLocalized, localizedText } from "@/lib/localized";
import type { PackageWithDetails } from "@/features/packages/hooks/usePackages";

type Itinerary = NonNullable<PackageWithDetails["itineraries"]>[number];

export function TripSchedule({ itineraries }: { itineraries: Itinerary[] }) {
    const { t } = useTranslation();
    const days = [...(itineraries ?? [])].sort((a, b) => a.day_number - b.day_number);

    if (days.length === 0) {
        return (
            <EmptyState
                icon="calendar"
                title={t("agencyDashboard.noScheduleYet", "No schedule yet")}
                description={t("agencyDashboard.noScheduleDesc", "Add day-by-day plans in the package editor.")}
            />
        );
    }

    return (
        <ol className="relative space-y-5">
            {/* connector line runs down the node column (logical start edge) */}
            <span className="absolute top-1 bottom-1 start-[7px] w-px bg-border" aria-hidden="true" />
            {days.map((day) => {
                const activities = (pickLocalized<string[]>(day, "activities") ?? []).filter((a) => a && a.trim());
                const meals = day.meals_included ?? [];
                return (
                    <li key={day.id} className="relative ps-6">
                        <span className="absolute start-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" aria-hidden="true" />
                        <p className="text-xs font-semibold text-primary">
                            {t("agencyDashboard.dayN", "Day {{n}}", { n: day.day_number })}
                        </p>
                        <p className="text-sm font-medium text-foreground leading-snug">{localizedText(day, "title")}</p>
                        {localizedText(day, "description") && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {localizedText(day, "description")}
                            </p>
                        )}
                        {activities.length > 0 && (
                            <ul className="mt-1.5 space-y-1">
                                {activities.map((a, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                        <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" aria-hidden="true" />
                                        <span className="min-w-0">{a}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {meals.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {meals.map((m, i) => (
                                    <span
                                        key={i}
                                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground capitalize"
                                    >
                                        {t(`packageWizard.${m.toLowerCase()}`, m)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
