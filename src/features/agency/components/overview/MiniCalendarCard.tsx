import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Button } from "@/ui/button";
import { formatDate } from "@/lib/formatters";
import type { OverviewBooking } from "@/features/agency/hooks/useAgencyOverview";

export function MiniCalendarCard({ bookings }: { bookings: OverviewBooking[] }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [month, setMonth] = useState(new Date());

    const monthStart = startOfMonth(month);
    const days = eachDayOfInterval({
        start: startOfWeek(monthStart),
        end: endOfWeek(endOfMonth(monthStart)),
    });

    const bookedDays = new Set(
        bookings
            .filter((b) => isSameMonth(parseISO(b.booking_date), monthStart))
            .map((b) => b.booking_date),
    );

    const weekdays = [
        t("calendar.sun", "Sun"), t("calendar.mon", "Mon"), t("calendar.tue", "Tue"),
        t("calendar.wed", "Wed"), t("calendar.thu", "Thu"), t("calendar.fri", "Fri"), t("calendar.sat", "Sat"),
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate("/travel_agency/calendar")}
                        className="text-sm font-semibold hover:text-primary transition-colors"
                    >
                        {formatDate(month, "MMMM yyyy")}
                    </button>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(subMonths(month, 1))} aria-label={t("calendar.previousMonth", "Previous month")}>
                            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, 1))} aria-label={t("calendar.nextMonth", "Next month")}>
                            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {weekdays.map((d) => (
                        <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                    {days.map((day) => {
                        const inMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());
                        const hasBooking = bookedDays.has(format(day, "yyyy-MM-dd"));
                        return (
                            <button
                                key={day.toString()}
                                type="button"
                                onClick={() => navigate("/travel_agency/calendar")}
                                className={`relative aspect-square grid place-items-center rounded-md text-xs transition-colors
                                    ${!inMonth ? "text-muted-foreground/40" : "text-foreground hover:bg-muted"}
                                    ${isToday ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90" : ""}`}
                            >
                                {format(day, "d")}
                                {hasBooking && !isToday && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
