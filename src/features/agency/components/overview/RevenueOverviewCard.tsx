import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { RevenuePoint } from "@/features/agency/hooks/useAgencyOverview";

interface RevenueOverviewCardProps {
    weekly: RevenuePoint[];
    monthly: RevenuePoint[];
}

function RevenueTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-semibold tabular-nums text-foreground">{formatCurrency(payload[0].value)}</p>
        </div>
    );
}

export function RevenueOverviewCard({ weekly, monthly }: RevenueOverviewCardProps) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");

    const series = period === "weekly" ? weekly : monthly;
    const hasData = series.some((p) => p.revenue > 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{t("agencyDashboard.revenueOverview", "Revenue Overview")}</CardTitle>
                    <Select value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">{t("agencyDashboard.weekly", "Weekly")}</SelectItem>
                            <SelectItem value="monthly">{t("agencyDashboard.monthly", "Monthly")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-64" dir="ltr">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    reversed={isRTL}
                                />
                                <YAxis
                                    orientation={isRTL ? "right" : "left"}
                                    tickLine={false}
                                    axisLine={false}
                                    width={48}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    tickFormatter={(v) => formatNumber(v)}
                                />
                                <Tooltip
                                    content={<RevenueTooltip />}
                                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="hsl(var(--chart-1))"
                                    strokeWidth={2}
                                    fill="url(#revenueFill)"
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--chart-1))" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            {t("agencyDashboard.noRevenueData", "No revenue in this period yet")}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
