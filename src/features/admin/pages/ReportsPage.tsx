import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import { StatsGrid } from "@/ui/stats-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Download, TrendingUp, Users, Package, DollarSign, RefreshCw } from "lucide-react";
import { useAdminReports } from "@/features/admin/hooks";
import { useTranslation } from "react-i18next";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { exportCsv } from "@/features/admin/lib/csv";
import { PageHeader } from "@/ui/page-header";

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [monthsBack, setMonthsBack] = useState(6);
  const { data, isLoading, isError, refetch } = useAdminReports(monthsBack);

  const stats = data?.stats ?? { growthRate: 0, avgBookingValue: 0, conversionRate: 0, activePackages: 0 };
  const monthlyData = data?.monthlyData ?? [];
  const destinationData = data?.destinationData ?? [];

  const handleExport = () => {
    if (monthlyData.length === 0) {
      toast.info(t('reports.nothingToExport', 'There is no report data to export'));
      return;
    }
    exportCsv(
      `platform-report-${new Date().toISOString().slice(0, 10)}`,
      monthlyData.map((m) => ({
        month: m.name,
        bookings: m.bookings,
        revenue_sar: m.revenue,
        new_travelers: m.users,
      })),
    );
    toast.success(t('reports.exportSuccess', 'Report exported'));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-start">
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 text-start">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="text-start">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('common.reports')}
        description={t('reports.subtitle')}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center">
              <RefreshCw className="w-4 h-4 me-2" />
              {t('common.refresh')}
            </Button>
            <Select value={String(monthsBack)} onValueChange={(v) => setMonthsBack(Number(v))}>
              <SelectTrigger className="w-40" aria-label={t('reports.dateRange', 'Date range')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('reports.lastMonth')}</SelectItem>
                <SelectItem value="3">{t('reports.last3Months')}</SelectItem>
                <SelectItem value="6">{t('reports.last6Months')}</SelectItem>
                <SelectItem value="12">{t('reports.lastYear')}</SelectItem>
              </SelectContent>
            </Select>
            <Button className="flex items-center" onClick={handleExport}>
              <Download className="w-4 h-4 me-2" />
              {t('reports.exportReport')}
            </Button>
          </>
        }
      />

      {isError && (
        <EmptyState
          icon="alert-triangle"
          title={t('reports.loadErrorTitle', 'Could not load reports')}
          description={t('reports.loadErrorDescription', 'Something went wrong while loading report data. Please try again.')}
          action={{ label: t('common.retry', 'Retry'), onClick: () => refetch() }}
        />
      )}

      <StatsGrid
        stats={[
          {
            title: t('reports.growthRate'),
            value: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate}%`,
            icon: TrendingUp,
            description: t('reports.vsPrevious'),
          },
          {
            title: t('reports.avgBookingValue'),
            value: formatCurrency(stats.avgBookingValue),
            icon: DollarSign,
            description: t('reports.perBooking'),
          },
          {
            title: t('reports.conversionRate'),
            value: `${stats.conversionRate}%`,
            icon: Users,
            description: t('reports.travelersToBookings'),
          },
          {
            title: t('reports.activePackages'),
            value: formatNumber(stats.activePackages),
            icon: Package,
            description: t('reports.publishedPackages'),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t('reports.monthlyPerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80" dir="ltr">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis orientation={isRTL ? 'right' : 'left'} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="hsl(var(--chart-1))" name={t('common.bookings')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="users" fill="hsl(var(--chart-2))" name={t('common.newUsers')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('reports.noMonthlyData')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t('reports.popularDestinations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80" dir="ltr">
              {destinationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={destinationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {destinationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('reports.noDestinationData')}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {destinationData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
