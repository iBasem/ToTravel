import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isSameMonth, isSameYear, parseISO, startOfMonth, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/lib/formatters";
import type { OverviewBooking } from "@/features/agency/hooks/useAgencyOverview";

type Period = "month" | "quarter" | "year" | "all";

// One hue, stepped by rank — the darkest slice is the top destination.
// Reads cleanly in light and dark (opacity blends over the card surface).
const RAMP = [1, 0.66, 0.42, 0.24];
const rampColor = (i: number) => ({ color: "hsl(var(--chart-2))", opacity: RAMP[i] ?? 0.18 });

export function TopDestinationsCard({ bookings }: { bookings: OverviewBooking[] }) {
    const { t } = useTranslation();
    const [period, setPeriod] = useState<Period>("month");

    const slices = useMemo(() => {
        const now = new Date();
        const quarterStart = startOfMonth(subMonths(now, 2));
        const inPeriod = (iso: string) => {
            const d = parseISO(iso);
            switch (period) {
                case "month":
                    return isSameMonth(d, now);
                case "quarter":
                    return d >= quarterStart;
                case "year":
                    return isSameYear(d, now);
                default:
                    return true;
            }
        };

        const byDestination = new Map<string, number>();
        let totalParticipants = 0;
        for (const b of bookings) {
            if (b.status === "cancelled") continue; // cancelled trips don't count
            if (!inPeriod(b.booking_date)) continue;
            const key = b.destination || t("common.unknown", "Unknown");
            byDestination.set(key, (byDestination.get(key) ?? 0) + b.participants);
            totalParticipants += b.participants;
        }

        const denom = totalParticipants || 1;
        return [...byDestination.entries()]
            .map(([name, participants]) => ({
                name,
                participants,
                percent: Math.round((participants / denom) * 100),
            }))
            .sort((a, b) => b.participants - a.participants)
            .slice(0, 4);
    }, [bookings, period, t]);

    const periodOptions: { value: Period; label: string }[] = [
        { value: "month", label: t("agencyDashboard.thisMonth", "This Month") },
        { value: "quarter", label: t("agencyDashboard.last3Months", "Last 3 Months") },
        { value: "year", label: t("agencyDashboard.thisYear", "This Year") },
        { value: "all", label: t("agencyDashboard.allTime", "All Time") },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{t("agencyDashboard.topDestinations", "Top Destinations")}</CardTitle>
                    <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <SelectTrigger className="w-36 h-8 text-xs" aria-label={t("agencyDashboard.filterPeriod", "Filter by period")}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {periodOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {slices.length === 0 ? (
                    <EmptyState
                        icon="map-pin"
                        title={t("agencyDashboard.noDestinationsYet", "No destinations yet")}
                        description={t("agencyDashboard.noDestinationsPeriod", "No trips for the selected period.")}
                    />
                ) : (
                    <div className="flex items-center gap-5 sm:gap-6">
                        <div className="h-40 w-40 shrink-0" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        cursor={false}
                                        content={({ active, payload }) =>
                                            active && payload?.length ? (
                                                <div className="rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">
                                                    <span className="font-medium text-foreground">{payload[0].name}</span>
                                                    <span className="text-muted-foreground tabular-nums ms-2">
                                                        {formatNumber(payload[0].value as number)} {t("agencyDashboard.participantsUnit", "Participants")}
                                                    </span>
                                                </div>
                                            ) : null
                                        }
                                    />
                                    <Pie
                                        data={slices}
                                        dataKey="participants"
                                        nameKey="name"
                                        innerRadius={46}
                                        outerRadius={74}
                                        paddingAngle={2}
                                        stroke="hsl(var(--card))"
                                        strokeWidth={2}
                                    >
                                        {slices.map((_, i) => {
                                            const { color, opacity } = rampColor(i);
                                            return <Cell key={i} fill={color} fillOpacity={opacity} />;
                                        })}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <ul className="flex-1 space-y-4 min-w-0">
                            {slices.map((d, i) => {
                                const { color, opacity } = rampColor(i);
                                return (
                                    <li key={d.name} className="flex items-start gap-2.5">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                                            style={{ backgroundColor: color, opacity }}
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm text-foreground truncate">
                                                <span className="font-medium">{d.name}</span>
                                                <span className="text-muted-foreground tabular-nums"> ({d.percent}%)</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                {formatNumber(d.participants)} {t("agencyDashboard.participantsUnit", "Participants")}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
