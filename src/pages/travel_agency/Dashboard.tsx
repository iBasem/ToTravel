import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Calendar, DollarSign } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

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
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header - Title anchored to start (right in RTL) */}
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <h1 className="text-3xl font-bold">{t('agencyDashboard.title')}</h1>
      </div>
      
      {/* KPI Cards - Grid flows naturally with RTL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* First KPI - Most important, appears first in reading order (right in RTL) */}
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalPackages')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : 'text-left'}>
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
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalBookings')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : 'text-left'}>
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
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalCustomers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : 'text-left'}>
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
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : 'text-left'}>
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('agencyDashboard.welcomeToDashboard')}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t('agencyDashboard.startByCreating')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}