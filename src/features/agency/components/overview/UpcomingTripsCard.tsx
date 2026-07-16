import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Users, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { addDays } from "date-fns";
import { formatDate } from "@/lib/formatters";
import type { OverviewBooking } from "@/features/agency/hooks/useAgencyOverview";

export function UpcomingTripsCard({ trips }: { trips: OverviewBooking[] }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t("agencyDashboard.upcomingTrips", "Upcoming Trips")}</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => navigate("/travel_agency/calendar")}
                        aria-label={t("agencyDashboard.openCalendar", "Open calendar")}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {trips.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                        {t("agencyDashboard.noUpcomingDepartures")}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {trips.map((trip) => {
                            const end = addDays(new Date(trip.booking_date), Math.max(0, trip.durationDays - 1));
                            return (
                                <li key={trip.id}>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/travel_agency/bookings")}
                                        className="w-full flex items-center gap-3 rounded-lg p-2 -mx-2 text-start hover:bg-muted transition-colors"
                                    >
                                        <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                                            <MapPin className="w-4 h-4" aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{trip.packageTitle}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {formatDate(trip.booking_date, "MMM d")} – {formatDate(end, "MMM d")}
                                            </p>
                                        </div>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                            <Users className="w-3.5 h-3.5" aria-hidden="true" />
                                            <span className="tabular-nums">{trip.participants}</span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
