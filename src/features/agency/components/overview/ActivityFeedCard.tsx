import { useTranslation } from "react-i18next";
import { CalendarCheck, Star, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { formatRelativeTime } from "@/lib/formatters";
import type { ActivityItem } from "@/features/agency/hooks/useAgencyOverview";

const ICONS = {
    booking: { Icon: CalendarCheck, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    review: { Icon: Star, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    cancelled: { Icon: XCircle, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
} as const;

export function ActivityFeedCard({ activity }: { activity: ActivityItem[] }) {
    const { t } = useTranslation();

    const describe = (a: ActivityItem) => {
        switch (a.type) {
            case "review":
                return t("agencyDashboard.activityReviewed", "{{name}} reviewed {{pkg}} ({{rating}}★)", {
                    name: a.travelerName,
                    pkg: a.packageTitle,
                    rating: a.rating,
                });
            case "cancelled":
                return t("agencyDashboard.activityCancelled", "{{name}} cancelled {{pkg}}", {
                    name: a.travelerName,
                    pkg: a.packageTitle,
                });
            default:
                return t("agencyDashboard.activityBooked", "{{name}} booked {{pkg}}", {
                    name: a.travelerName,
                    pkg: a.packageTitle,
                });
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("agencyDashboard.recentActivity", "Recent Activity")}</CardTitle>
            </CardHeader>
            <CardContent>
                {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                        {t("agencyDashboard.noRecentActivity", "No recent activity")}
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {activity.map((a) => {
                            const { Icon, className } = ICONS[a.type];
                            return (
                                <li key={a.id} className="flex items-start gap-3">
                                    <span className={`grid place-items-center w-8 h-8 rounded-full shrink-0 ${className}`}>
                                        <Icon className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1 text-start">
                                        <p className="text-sm leading-snug">{describe(a)}</p>
                                        <span className="text-xs text-muted-foreground">{formatRelativeTime(a.at)}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
