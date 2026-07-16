import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Input } from "@/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { OverviewBooking } from "@/features/agency/hooks/useAgencyOverview";

function statusBadgeClass(status: string) {
    switch (status) {
        case "confirmed":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "pending":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "completed":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        default:
            return "bg-muted text-muted-foreground";
    }
}

export function RecentBookingsCard({ bookings }: { bookings: OverviewBooking[] }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");

    const statusLabel = (status: string) => {
        switch (status) {
            case "confirmed":
                return t("agencyDashboard.confirmed");
            case "pending":
                return t("agencyDashboard.pending");
            case "cancelled":
                return t("agencyDashboard.cancelled");
            case "completed":
                return t("agencyDashboard.completed", "Completed");
            default:
                return status;
        }
    };

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? bookings.filter(
                (b) =>
                    b.travelerName.toLowerCase().includes(q) ||
                    b.packageTitle.toLowerCase().includes(q),
            )
            : bookings;
        return filtered.slice(0, 8);
    }, [bookings, query]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-base">{t("agencyDashboard.recentBookings")}</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground start-2.5" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t("agencyDashboard.searchAnything")}
                                className="h-8 w-full sm:w-48 text-xs ps-8"
                            />
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/travel_agency/bookings">{t("common.viewAll")}</Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        {query
                            ? t("agencyDashboard.noBookingsFound", "No bookings match your search")
                            : t("agencyDashboard.noBookingsYet")}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-start">{t("agencyDashboard.name", "Name")}</TableHead>
                                    <TableHead className="text-start">{t("agencyDashboard.package", "Package")}</TableHead>
                                    <TableHead className="text-start whitespace-nowrap">{t("agencyDashboard.duration", "Duration")}</TableHead>
                                    <TableHead className="text-start whitespace-nowrap">{t("agencyDashboard.date", "Date")}</TableHead>
                                    <TableHead className="text-end">{t("agencyDashboard.price", "Price")}</TableHead>
                                    <TableHead className="text-start">{t("agencyDashboard.status", "Status")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">{b.travelerName || t("packageWizard.unknownTraveler")}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-[10rem] truncate">{b.packageTitle}</TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                                            {b.durationDays}{t("agencyDashboard.dayShort", "D")}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(b.booking_date, "PP")}</TableCell>
                                        <TableCell className="text-end font-medium tabular-nums">{formatCurrency(b.total_price)}</TableCell>
                                        <TableCell>
                                            <Badge className={`${statusBadgeClass(b.status)} text-xs`}>{statusLabel(b.status)}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
