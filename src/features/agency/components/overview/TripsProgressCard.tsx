import { useTranslation } from "react-i18next";
import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { formatNumber } from "@/lib/formatters";

interface TripsProgressCardProps {
    trips: { completed: number; upcoming: number; cancelled: number; total: number };
}

export function TripsProgressCard({ trips }: TripsProgressCardProps) {
    const { t } = useTranslation();
    const total = trips.total || 1;

    const segments = [
        { key: "completed", value: trips.completed, className: "bg-chart-2", label: t("agencyDashboard.done", "Done") },
        { key: "upcoming", value: trips.upcoming, className: "bg-chart-1", label: t("agencyDashboard.booked", "Booked") },
        { key: "cancelled", value: trips.cancelled, className: "bg-muted-foreground/40", label: t("agencyDashboard.cancelled") },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Plane className="w-4 h-4 rtl-flip" aria-hidden="true" />
                    </span>
                    <div className="text-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("agencyDashboard.totalTrips", "Total Trips")}
                        </CardTitle>
                        <p className="text-2xl font-bold tabular-nums leading-tight">{formatNumber(trips.total)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" dir="ltr">
                    {segments.map((s) =>
                        s.value > 0 ? (
                            <div
                                key={s.key}
                                className={s.className}
                                style={{ width: `${(s.value / total) * 100}%` }}
                                title={`${s.label}: ${s.value}`}
                            />
                        ) : null,
                    )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {segments.map((s) => (
                        <div key={s.key} className="flex items-center gap-1.5 text-xs">
                            <span className={`w-2.5 h-2.5 rounded-full ${s.className}`} aria-hidden="true" />
                            <span className="text-muted-foreground">{s.label}</span>
                            <span className="font-medium tabular-nums">{formatNumber(s.value)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
