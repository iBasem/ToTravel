import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Users, Package, Calendar, DollarSign } from "lucide-react";
import { useDashboardStats } from "@/features/agency/hooks/useDashboardStats";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats();
  const { t, i18n } = useTranslation();


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
        <p className="text-red-600">{t('agencyDashboard.errorLoadingDashboard')}: {error}</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      {stats.totalPackages === 0 && (
        <EmptyState
          icon="package"
          title={t('agencyDashboard.welcomeToDashboard')}
          description={t('agencyDashboard.startByCreating')}
          action={{
            label: t('agencyDashboard.createPackage'),
            onClick: () => window.location.href = "/travel_agency/packages/create"
          }}
        />
      )}
    </div>
  );
}