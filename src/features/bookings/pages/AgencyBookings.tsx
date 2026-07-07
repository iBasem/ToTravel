
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Eye, MessageSquare, Calendar, User, Phone, Mail } from "lucide-react";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useBookings } from "@/features/bookings/hooks/useBookings";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/formatters";

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const { bookings, loading, error, updateBookingStatus } = useBookings();

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
        <Button onClick={() => window.location.reload()} className="mt-4">
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
      default:
        return status;
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    const result = await updateBookingStatus(bookingId, newStatus);
    if (result.success) {
      toast.success(t('packageWizard.bookingUpdated', { status: getStatusLabel(newStatus) }));
    } else {
      toast.error(result.error || t('packageWizard.failedToUpdate'));
    }
  };

  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  const totalRevenue = bookings
    .filter(b => b.status === "confirmed")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{t('agencyDashboard.bookingsManagement')}</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">{t('agencyDashboard.trackBookings')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('agencyDashboard.totalBookings')}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">{bookings.length}</p>
              </div>
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('agencyDashboard.pending')}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-yellow-600">{pendingBookings}</p>
              </div>
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('agencyDashboard.confirmed')}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600">{confirmedBookings}</p>
              </div>
              <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('agencyDashboard.revenue')}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-primary">
                  {new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(totalRevenue)}
                </p>
              </div>
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
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
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {booking.id.slice(-8)}
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
                            {new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'USD' }).format(Number(booking.total_price))}
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
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                          >
                            {t('agencyDashboard.confirm')}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="border-border hover:bg-muted/50 text-xs px-2 py-1 gap-1">
                          <Eye className="w-3 h-3" />
                          <span className="sr-only sm:not-sr-only">{t('agencyDashboard.view')}</span>
                        </Button>
                        <Button size="sm" variant="outline" className="border-border hover:bg-muted/50 text-xs px-2 py-1 gap-1">
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
    </div>
  );
}
