
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Textarea } from "@/ui/textarea";
import { Eye, MessageSquare, Calendar, Phone, Mail, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { shortId } from "@/lib/utils";
import { totalRevenue as sumRevenue } from "@/features/agency/lib/revenue";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useBookings, type Booking } from "@/features/bookings/hooks/useBookings";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDate, formatCurrency } from "@/lib/formatters";

export default function Bookings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookings, loading, error, updateBookingStatus, refetch } = useBookings();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive text-sm sm:text-base">{t('agencyDashboard.errorLoadingBookings')}: {error}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return t('agencyDashboard.confirmed');
      case "pending":
        return t('agencyDashboard.pending');
      case "cancelled":
        return t('agencyDashboard.cancelled');
      case "completed":
        return t('agencyDashboard.completed', 'Completed');
      default:
        return status;
    }
  };

  const handleStatusUpdate = async (
    bookingId: string,
    newStatus: string,
    options?: { cancellationReason?: string },
  ) => {
    const result = await updateBookingStatus(bookingId, newStatus, options);
    if (result.success) {
      toast.success(t('packageWizard.bookingUpdated', { status: getStatusLabel(newStatus) }));
    } else {
      toast.error(result.error || t('packageWizard.failedToUpdate'));
    }
    return result.success;
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    const ok = await handleStatusUpdate(declineTarget.id, 'cancelled', {
      cancellationReason: declineReason,
    });
    if (ok) {
      setDeclineTarget(null);
      setDeclineReason("");
    }
  };

  // A confirmed, paid booking whose travel date has passed can be closed out.
  const todayIso = new Date().toISOString().slice(0, 10);
  const canComplete = (b: Booking) =>
    b.status === 'confirmed' && b.payment_status === 'paid' && b.booking_date <= todayIso;

  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  // Shared revenue definition (AGY-22): confirmed + completed.
  const totalRevenue = sumRevenue(bookings);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{t('agencyDashboard.bookingsManagement')}</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">{t('agencyDashboard.trackBookings')}</p>
      </div>

      {/* Stats Cards — same quiet vocabulary as the agency overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          { label: t('agencyDashboard.totalBookings'), value: String(bookings.length), icon: Calendar },
          { label: t('agencyDashboard.pending'), value: String(pendingBookings), icon: Clock },
          { label: t('agencyDashboard.confirmed'), value: String(confirmedBookings), icon: CheckCircle2 },
          { label: t('agencyDashboard.revenue'), value: formatCurrency(totalRevenue), icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground tabular-nums">{value}</p>
                </div>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings List */}
      <Card className="bg-card border-border">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">{t('agencyDashboard.recentBookings')}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {bookings.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-3 p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    {/* Left section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm sm:text-base text-foreground">
                            {booking.travelers ? `${booking.travelers.first_name} ${booking.travelers.last_name}` : t('packageWizard.unknownTraveler')}
                          </p>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                            {shortId(booking.id)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                        {booking.packages?.title || t('packageWizard.unknownPackage')}
                      </p>
                      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{booking.travelers?.email || t('agencyDashboard.noEmail')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{booking.travelers?.phone || t('agencyDashboard.noPhone')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right section */}
                    <div className="flex flex-col sm:items-end gap-2 sm:gap-3">
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1">
                        <div className="text-end">
                          <p className="font-bold text-base sm:text-lg text-foreground">
                            {formatCurrency(Number(booking.total_price))}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatDate(booking.booking_date, 'PP')}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(booking.status)} border font-medium text-xs capitalize`}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                            >
                              {t('agencyDashboard.confirm')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs px-2 py-1"
                              onClick={() => setDeclineTarget(booking)}
                            >
                              {t('agencyDashboard.decline', 'Decline')}
                            </Button>
                          </>
                        )}
                        {canComplete(booking) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1"
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                          >
                            {t('agencyDashboard.markCompleted', 'Mark completed')}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border hover:bg-muted/50 text-xs px-2 py-1 gap-1"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="w-3 h-3" />
                          <span className="sr-only sm:not-sr-only">{t('agencyDashboard.view')}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border hover:bg-muted/50 text-xs px-2 py-1 gap-1"
                          onClick={() => navigate(`/travel_agency/messages?to=${booking.traveler_id}`)}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span className="sr-only sm:not-sr-only">{t('agencyDashboard.message')}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile contact info */}
                  <div className="sm:hidden flex flex-col gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>{booking.travelers?.email || t('agencyDashboard.noEmail')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{booking.travelers?.phone || t('agencyDashboard.noPhone')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="calendar"
              title={t('agencyDashboard.noBookingsYet')}
              description={t('agencyDashboard.noBookingsDesc')}
            />
          )}
        </CardContent>
      </Card>

      {/* Booking details dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>{t('agencyDashboard.bookingDetails', 'Booking Details')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-start">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedBooking.packages?.title || t('packageWizard.unknownPackage')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedBooking.booking_date, 'PPPP')}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(selectedBooking.status)} border font-medium text-xs capitalize`}>
                    {getStatusLabel(selectedBooking.status)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('agencyDashboard.traveler', 'Traveler')}</p>
                    <p className="text-sm font-medium">
                      {selectedBooking.travelers
                        ? `${selectedBooking.travelers.first_name} ${selectedBooking.travelers.last_name}`
                        : t('packageWizard.unknownTraveler')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('agencyDashboard.participants', 'Participants')}</p>
                    <p className="text-sm font-medium tabular-nums">{selectedBooking.participants}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('agencyDashboard.totalPrice', 'Total Price')}</p>
                    <p className="text-sm font-medium tabular-nums">{formatCurrency(Number(selectedBooking.total_price))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('agencyDashboard.bookedOn', 'Booked on')}</p>
                    <p className="text-sm font-medium">{formatDate(selectedBooking.created_at, 'PP')}</p>
                  </div>
                </div>
                {(selectedBooking.travelers?.email || selectedBooking.travelers?.phone) && (
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground border-t border-border pt-3">
                    {selectedBooking.travelers?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedBooking.travelers.email}</span>
                      </div>
                    )}
                    {selectedBooking.travelers?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span dir="ltr">{selectedBooking.travelers.phone}</span>
                      </div>
                    )}
                  </div>
                )}
                {selectedBooking.special_requests && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('agencyDashboard.specialRequests', 'Special requests')}</p>
                    <p className="text-sm">{selectedBooking.special_requests}</p>
                  </div>
                )}
                {selectedBooking.status === 'cancelled' && selectedBooking.cancellation_reason && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('agencyDashboard.cancellationReason', 'Cancellation reason')}</p>
                    <p className="text-sm">{selectedBooking.cancellation_reason}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline booking dialog */}
      <Dialog open={!!declineTarget} onOpenChange={(open) => { if (!open) { setDeclineTarget(null); setDeclineReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('agencyDashboard.declineBookingTitle', 'Decline this booking?')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-start">
            {t('agencyDashboard.declineBookingDesc', 'The traveler will see the booking as cancelled. You can add an optional reason.')}
          </p>
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder={t('agencyDashboard.declineReasonPlaceholder', 'Reason (optional)')}
            rows={3}
            dir="auto"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeclineTarget(null); setDeclineReason(""); }}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDecline}>
              {t('agencyDashboard.decline', 'Decline')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
