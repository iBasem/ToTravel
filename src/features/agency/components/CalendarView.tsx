
import { useState, useEffect } from "react";
import {
    format,
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
            case 'confirmed': return "bg-green-100 text-green-800 border-green-200";
            case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'cancelled': return "bg-red-100 text-red-800 border-red-200";
            case 'completed': return "bg-blue-100 text-blue-800 border-blue-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                    {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={goToToday}>
                        {t('calendar.today')}
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[500px] border rounded-lg bg-gray-50">
                    <LoadingSpinner size="lg" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 h-[500px] border rounded-lg bg-gray-50">
                    <p className="font-medium text-gray-700">{t('calendar.loadError')}</p>
                    <p className="text-sm text-gray-500">{error}</p>
                    <Button variant="outline" onClick={() => fetchMonthBookings(currentDate)}>
                        {t('common.retry')}
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
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
                            <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600 bg-gray-50 border-r last:border-0">
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
                    min-h-[120px] p-2 border-b border-r last:border-r-0 relative
                    ${!isCurrentMonth ? "bg-gray-50/50 text-gray-400" : "bg-white"}
                    ${isToday ? "bg-blue-50/30" : ""}
                  `}
                                >
                                    <div className={`
                    text-sm font-medium mb-1 flex justify-between items-center
                    ${isToday ? "text-blue-600" : ""}
                  `}>
                                        <span className={isToday ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center" : ""}>
                                            {format(day, "d")}
                                        </span>
                                        {dayBookings.length > 0 && (
                                            <span className="text-xs text-gray-500 font-normal">
                                                {dayBookings.length} {t('calendar.bookingsCount')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {dayBookings.map((booking) => (
                                            <div
                                                key={booking.id}
                                                onClick={() => setSelectedBooking(booking)}
                                                className={`
                          text-xs p-1.5 rounded border cursor-pointer hover:shadow-sm transition-shadow truncate
                          ${getStatusColor(booking.status)}
                        `}
                                            >
                                                <span className="font-semibold block truncate">
                                                    {booking.traveler.first_name} {booking.traveler.last_name}
                                                </span>
                                                <span className="opacity-75 truncate">{booking.package.title}</span>
                                            </div>
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
                                    <p className="text-gray-500 text-sm">
                                        {format(parseISO(selectedBooking.booking_date), "EEEE, MMMM do, yyyy")}
                                    </p>
                                </div>
                                <Badge className={getStatusColor(selectedBooking.status)}>
                                    {selectedBooking.status}
                                </Badge>
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <User className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{t('common.traveler')}</p>
                                        <p className="text-gray-700">
                                            {selectedBooking.traveler.first_name} {selectedBooking.traveler.last_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{t('common.participants')}</p>
                                        <p className="font-medium">{selectedBooking.participants}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{t('common.totalPrice')}</p>
                                        <p className="font-medium">${selectedBooking.total_price}</p>
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
