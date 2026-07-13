import { useState } from "react";
import { shortId } from "@/lib/utils";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Download,
  MessageSquare,
  Star,
  CreditCard,
  Loader2,
  XCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import { useBookings, type Booking } from "@/features/bookings/hooks/useBookings";
import { usePayment } from "@/features/bookings/hooks/usePayment";
import { useCancelBooking } from "@/features/bookings/hooks/useCancelBooking";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { localizedText } from "@/lib/localized";
import { downloadBookingVoucher } from "@/features/bookings/lib/voucher";
import { ContactAgencyDialog } from "@/features/packages/components/details/ContactAgencyDialog";

import { useNavigate } from "react-router-dom";

// The bookings query also embeds packages.package_media and agency_id (see
// useBookings), which the shared Booking interface does not declare.
type BookingWithMedia = Booking & {
  payment_status?: string | null;
  packages?: Booking["packages"] & {
    package_media?: { file_path: string }[];
    agency_id?: string;
  };
};

export default function TravelerBookings() {
  const [activeTab, setActiveTab] = useState("all");
  const [contactBooking, setContactBooking] = useState<BookingWithMedia | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingWithMedia | null>(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { bookings, loading, error, refetch } = useBookings();
  const { startPayment, loading: paying } = usePayment();
  const { cancelBooking, loading: cancelling } = useCancelBooking();

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const result = await cancelBooking(cancelTarget.id);
    setCancelTarget(null);
    if (result.success) refetch();
  };

  // Cancellable = not started/finished and no money moved (paid bookings go
  // through the refund flow; the edge function enforces the same rules).
  const isCancellable = (booking: BookingWithMedia) =>
    (booking.status === "pending" || booking.status === "confirmed") &&
    booking.payment_status !== "paid" &&
    booking.payment_status !== "refunded";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-destructive">
        {t('errors.somethingWentWrong', 'Failed to load bookings. Please try again later.')}
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('travelerDashboard.myBookings')}</h1>
        <EmptyState
          icon="calendar"
          title={t('travelerDashboard.noBookingsFound', 'No bookings found')}
          description={t('travelerDashboard.noBookingsDesc', "You haven't made any bookings yet. Browse our packages to find your next adventure!")}
          action={{
            label: t('travelerDashboard.explorePackages', 'Explore Packages'),
            onClick: () => navigate("/packages")
          }}
        />
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return booking.status === "confirmed" || booking.status === "pending";
    if (activeTab === "completed") return booking.status === "completed";
    if (activeTab === "cancelled") return booking.status === "cancelled";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return t('travelerDashboard.confirmed');
      case "pending": return t('travelerDashboard.pending');
      case "completed": return t('travelerDashboard.completed');
      case "cancelled": return t('travelerDashboard.cancelled');
      default: return status;
    }
  };

  const handleDownloadVoucher = (booking: BookingWithMedia) => {
    downloadBookingVoucher(
      {
        id: booking.id,
        bookingDate: booking.booking_date,
        participants: booking.participants,
        totalPrice: booking.total_price,
        status: getStatusTranslation(booking.status),
        paymentStatus: booking.payment_status,
        packageTitle: localizedText(booking.packages, 'title') || t('common.unknownPackage'),
        destination: localizedText(booking.packages, 'destination') || '',
        durationDays: booking.packages?.duration_days,
        travelerName: [booking.travelers?.first_name, booking.travelers?.last_name].filter(Boolean).join(' ') || undefined,
      },
      t,
      i18n.dir() === 'rtl' ? 'rtl' : 'ltr'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('travelerDashboard.myBookings')}</h1>
        <p className="text-muted-foreground">{t('travelerDashboard.manageBookings')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">{t('travelerDashboard.allBookings')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('travelerDashboard.upcoming')}</TabsTrigger>
          <TabsTrigger value="completed">{t('travelerDashboard.completed')}</TabsTrigger>
          <TabsTrigger value="cancelled">{t('travelerDashboard.cancelled')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('common.noItemsFound', { item: activeTab })}
            </div>
          ) : (
            filteredBookings.map((booking: BookingWithMedia) => {
              const packageData = booking.packages;
              const packageTitle = localizedText(packageData, 'title');
              const packageDestination = localizedText(packageData, 'destination');
              const imageUrl = packageData?.package_media?.[0]?.file_path || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop";

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-64">
                        <img
                          src={imageUrl}
                          alt={packageTitle || t('common.tourImage')}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">{packageTitle || t('common.unknownPackage')}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 flex-wrap">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {packageDestination}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.booking_date, 'MMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {packageData?.duration_days} {t('common.days')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {booking.participants} {booking.participants === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('travelerDashboard.bookingRef')}: {shortId(booking.id)}</p>
                          </div>
                          <div className="text-end">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusTranslation(booking.status)}
                            </Badge>
                            <p className="text-xl font-bold text-foreground mt-2 tabular-nums">{formatCurrency(booking.total_price)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              onClick={() => startPayment(booking.id)}
                              disabled={paying}
                              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                            >
                              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                              {t('payments.payNow', 'Pay now')}
                            </Button>
                          )}
                          {booking.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadVoucher(booking)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              {t('travelerDashboard.downloadVoucher')}
                            </Button>
                          )}
                          {booking.packages?.agency_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setContactBooking(booking)}
                              className="flex items-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {t('travelerDashboard.contactAgency', 'Contact agency')}
                            </Button>
                          )}
                          {booking.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/packages/${booking.package_id}#reviews`)}
                              className="flex items-center gap-2"
                            >
                              <Star className="w-4 h-4" />
                              {t('travelerDashboard.writeReview')}
                            </Button>
                          )}
                          {isCancellable(booking) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCancelTarget(booking)}
                              className="flex items-center gap-2 text-destructive hover:text-destructive"
                            >
                              <XCircle className="w-4 h-4" />
                              {t('travelerDashboard.cancelBooking', 'Cancel booking')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel-booking confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('travelerDashboard.cancelBookingTitle', 'Cancel this booking?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('travelerDashboard.cancelBookingDesc', {
                title: localizedText(cancelTarget?.packages, 'title') || t('common.unknownPackage'),
                defaultValue: 'Your booking for "{{title}}" will be cancelled and its seats released. This cannot be undone.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              {t('travelerDashboard.keepBooking', 'Keep booking')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmCancel(); }}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('travelerDashboard.confirmCancelBooking', 'Cancel booking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message-the-agency dialog for the selected booking */}
      {contactBooking?.packages?.agency_id && (
        <ContactAgencyDialog
          isOpen={!!contactBooking}
          onClose={() => setContactBooking(null)}
          agencyId={contactBooking.packages.agency_id}
          subject={`${localizedText(contactBooking.packages, 'title') || t('common.unknownPackage')} · ${shortId(contactBooking.id)}`}
        />
      )}
    </div>
  );
}
