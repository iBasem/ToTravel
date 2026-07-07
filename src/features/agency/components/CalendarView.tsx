
import { useState, useEffect } from "react";
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from "date-fns";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { useAgencyCalendar, CalendarBooking } from "@/features/agency/hooks/useAgencyCalendar";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/formatters";

export function CalendarView() {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { bookings, loading, error, fetchMonthBookings } = useAgencyCalendar();
    const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);

    useEffect(() => {
        fetchMonthBookings(currentDate);
    }, [currentDate, fetchMonthBookings]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const getDayBookings = (day: Date) => {
        return bookings.filter(booking => isSameDay(parseISO(booking.booking_date), day));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900";
            case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900";
            case 'cancelled': return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900";
            case 'completed': return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                    {formatDate(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth} aria-label={t('calendar.previousMonth', 'Previous month')}>
                        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                    <Button variant="outline" onClick={goToToday}>
                        {t('calendar.today')}
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} aria-label={t('calendar.nextMonth', 'Next month')}>
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/50">
                    <LoadingSpinner size="lg" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 h-[500px] border rounded-lg bg-muted/50">
                    <p className="font-medium text-foreground">{t('calendar.loadError')}</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={() => fetchMonthBookings(currentDate)}>
                        {t('common.retry')}
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b">
                        {[
                            t('calendar.sun', { defaultValue: 'Sun' }),
                            t('calendar.mon', { defaultValue: 'Mon' }),
                            t('calendar.tue', { defaultValue: 'Tue' }),
                            t('calendar.wed', { defaultValue: 'Wed' }),
                            t('calendar.thu', { defaultValue: 'Thu' }),
                            t('calendar.fri', { defaultValue: 'Fri' }),
                            t('calendar.sat', { defaultValue: 'Sat' })
                        ].map((day) => (
                            <div key={day} className="py-2 text-center text-sm font-semibold text-muted-foreground bg-muted/50 border-e last:border-e-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 grid-rows-[repeat(auto-fill,minmax(120px,1fr))] auto-rows-fr">
                        {calendarDays.map((day, dayIdx) => {
                            const dayBookings = getDayBookings(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={day.toString()}
                                    className={`
                    min-h-[120px] p-2 border-b border-e last:border-e-0 relative
                    ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground/60" : "bg-card"}
                    ${isToday ? "bg-primary/5" : ""}
                  `}
                                >
                                    <div className={`
                    text-sm font-medium mb-1 flex justify-between items-center
                    ${isToday ? "text-primary" : ""}
                  `}>
                                        <span className={isToday ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center" : ""}>
                                            {formatDate(day, "d")}
                                        </span>
                                        {dayBookings.length > 0 && (
                                            <span className="text-xs text-muted-foreground font-normal">
                                                {t('calendar.bookingsCount', { count: dayBookings.length })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {dayBookings.map((booking) => (
                                            <button
                                                key={booking.id}
                                                type="button"
                                                onClick={() => setSelectedBooking(booking)}
                                                className={`
                          w-full text-start text-xs p-1.5 rounded border hover:shadow-sm transition-shadow truncate
                          ${getStatusColor(booking.status)}
                        `}
                                            >
                                                <span className="font-semibold block truncate">
                                                    {booking.traveler.first_name} {booking.traveler.last_name}
                                                </span>
                                                <span className="opacity-75 truncate">{booking.package.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Booking Details Modal */}
            <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('calendar.bookingDetails')}</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-lg">
                                        {selectedBooking.package.title}
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                        {formatDate(selectedBooking.booking_date, "EEEE, MMMM do, yyyy")}
                                    </p>
                                </div>
                                <Badge className={getStatusColor(selectedBooking.status)}>
                                    {t(`common.${selectedBooking.status}`, { defaultValue: selectedBooking.status })}
                                </Badge>
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted p-2 rounded-full">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{t('common.traveler')}</p>
                                        <p className="text-muted-foreground">
                                            {selectedBooking.traveler.first_name} {selectedBooking.traveler.last_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('common.participants')}</p>
                                        <p className="font-medium">{selectedBooking.participants}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('common.totalPrice')}</p>
                                        <p className="font-medium">{formatCurrency(selectedBooking.total_price)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
