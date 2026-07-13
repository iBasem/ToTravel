import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Users, Package, Calendar, DollarSign, MapPin } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { useDashboardStats } from "@/features/agency/hooks/useDashboardStats";
import { useBookings } from "@/features/bookings/hooks/useBookings";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats();
  const { bookings } = useBookings();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // useBookings returns newest-created first; departures need travel-date order.
  const recentBookings = bookings.slice(0, 5);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingDepartures = bookings
    .filter((b) => b.status === "confirmed" && b.booking_date >= today)
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
    .slice(0, 5);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "cancelled":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
        <p className="text-destructive">{t('agencyDashboard.errorLoadingDashboard')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Title anchored to start */}
      <div className="text-start">
        <h1 className="text-3xl font-bold">{t('agencyDashboard.title')}</h1>
      </div>

      {/* KPI Cards - Grid flows naturally with RTL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* First KPI - Most important, appears first in reading order (right in RTL) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalPackages')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.totalPackages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPackages === 0
                ? t('agencyDashboard.createFirstPackage')
                : t('agencyDashboard.activePackages')
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalBookings')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBookings === 0
                ? t('agencyDashboard.noBookingsYet')
                : t('agencyDashboard.customerBookings')
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalCustomers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers === 0
                ? t('agencyDashboard.noCustomersYet')
                : t('agencyDashboard.uniqueTravelers')
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRevenue === 0
                ? t('agencyDashboard.noRevenueYet')
                : t('agencyDashboard.totalEarnings')
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State Card */}
      {stats.totalPackages === 0 ? (
        <EmptyState
          icon="package"
          title={t('agencyDashboard.welcomeToDashboard')}
          description={t('agencyDashboard.startByCreating')}
          action={{
            label: t('agencyDashboard.createPackage'),
            onClick: () => navigate("/travel_agency/packages/create")
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t('agencyDashboard.recentBookings')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/travel_agency/bookings">{t('common.viewAll')}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {t('agencyDashboard.noBookingsYet')}
                </p>
              ) : (
                <div className="divide-y">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 text-start">
                        <p className="text-sm font-medium truncate">
                          {booking.travelers
                            ? `${booking.travelers.first_name} ${booking.travelers.last_name}`
                            : t('packageWizard.unknownTraveler')}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {booking.packages?.title || t('packageWizard.unknownPackage')} · {formatDate(booking.booking_date, 'PP')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium tabular-nums">{formatCurrency(Number(booking.total_price))}</span>
                        <Badge className={`${statusBadgeClass(booking.status)} text-xs`}>{statusLabel(booking.status)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming departures */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t('agencyDashboard.upcomingDepartures')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/travel_agency/calendar">{t('common.viewAll')}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingDepartures.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {t('agencyDashboard.noUpcomingDepartures')}
                </p>
              ) : (
                <div className="divide-y">
                  {upcomingDepartures.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                        <div className="min-w-0 text-start">
                          <p className="text-sm font-medium truncate">
                            {booking.packages?.title || t('packageWizard.unknownPackage')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {booking.travelers
                              ? `${booking.travelers.first_name} ${booking.travelers.last_name}`
                              : t('packageWizard.unknownTraveler')} · {booking.participants} {t('agencyDashboard.participants', 'participants')}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDate(booking.booking_date, 'PP')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}