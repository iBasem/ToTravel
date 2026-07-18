import { Calendar, UserPlus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatsCard } from "@/ui/stats-card";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { Kpi } from "@/features/agency/hooks/useAgencyOverview";

function DeltaFooter({ delta, caption }: { delta: number | null; caption: string }) {
    if (delta === null) {
        return <p className="text-xs text-muted-foreground mt-1">{caption}</p>;
    }
    const negative = delta < 0;
    const Icon = negative ? TrendingDown : TrendingUp;
    return (
        <div className="flex items-center gap-1 mt-1 text-xs">
            <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums ${negative
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                dir="ltr"
            >
                <Icon className="w-3 h-3" aria-hidden="true" />
                {negative ? "" : "+"}{delta}%
            </span>
            <span className="text-muted-foreground">{caption}</span>
        </div>
    );
}

interface OverviewKpisProps {
    bookings: Kpi;
    newCustomers: Kpi;
    earnings: Kpi;
}

export function OverviewKpis({ bookings, newCustomers, earnings }: OverviewKpisProps) {
    const { t } = useTranslation();
    // The big number is the ALL-TIME total while the delta compares 30-day
    // windows — the caption must say so or the % reads as growth of the total
    // (AGY-49).
    const vsPrev = t("agencyDashboard.delta30v30", "last 30 days vs prior 30");

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <StatsCard
                title={t("agencyDashboard.totalBookings")}
                icon={Calendar}
                value={formatNumber(bookings.value)}
                footer={<DeltaFooter delta={bookings.delta} caption={vsPrev} />}
            />
            <StatsCard
                title={t("agencyDashboard.newCustomers", "New Customers")}
                icon={UserPlus}
                value={formatNumber(newCustomers.value)}
                footer={
                    <DeltaFooter
                        delta={newCustomers.delta}
                        caption={t("agencyDashboard.last30Days", "last 30 days")}
                    />
                }
            />
            <StatsCard
                title={t("agencyDashboard.totalEarnings")}
                icon={DollarSign}
                value={formatCurrency(earnings.value)}
                footer={<DeltaFooter delta={earnings.delta} caption={vsPrev} />}
            />
        </div>
    );
}
