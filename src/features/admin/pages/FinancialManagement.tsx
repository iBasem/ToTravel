import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { DollarSign, TrendingUp, CreditCard, Building2, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useAdminFinancials } from "@/features/admin/hooks";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function FinancialManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { payouts, stats, revenueData, loading, refetch, processPayouts } = useAdminFinancials();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800">{t('common.processed')}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('common.pending')}</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">{t('common.failed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    const result = await processPayouts([payoutId]);
    if (result.success) {
      toast.success(t('financials.payoutSuccess'));
    } else {
      toast.error(t('financials.payoutError'));
    }
  };

  const handleProcessAllPending = async () => {
    const pendingIds = payouts.filter(p => p.status === 'pending').map(p => p.id);
    if (pendingIds.length === 0) {
      toast.info(t('financials.noPendingPayouts'));
      return;
    }
    const result = await processPayouts(pendingIds);
    if (result.success) {
      toast.success(t('financials.batchPayoutSuccess', { count: pendingIds.length }));
    } else {
      toast.error(t('financials.batchPayoutError'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-start">
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent className="text-start">
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="text-start">
          <h1 className="text-3xl font-bold text-gray-900">{t('financials.title')}</h1>
          <p className="text-gray-600">{t('financials.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} className="flex items-center">
            <RefreshCw className="w-4 h-4 me-2" />
            {t('common.refresh')}
          </Button>
          <Button>{t('financials.generateReport')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('financials.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 me-1" />
              {t('financials.fromConfirmedBookings')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('financials.platformCommission')}</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.platformCommission)}</div>
            <div className="text-sm text-gray-500">
              {t('financials.commissionRateDesc')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('financials.pendingPayouts')}</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.pendingPayouts)}</div>
            <div className="text-sm text-gray-500">
              {stats.pendingPayoutsCount} {t('financials.agenciesPending')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('financials.processedPayouts')}</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.processedPayouts)}</div>
            <div className="text-sm text-gray-500">
              {t('financials.totalProcessed')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-start">
          <CardTitle>{t('financials.revenueOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80" dir="ltr">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis orientation={isRTL ? 'right' : 'left'} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name={t('financials.totalRevenue')}
                  />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    stroke="#10B981"
                    strokeWidth={2}
                    name={t('financials.platformCommission')}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('financials.noRevenueData')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('financials.agencyPayouts')}</CardTitle>
            <Button onClick={handleProcessAllPending}>{t('financials.processAllPending')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('financials.noPayoutsFound')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('financials.payoutId')}</TableHead>
                  <TableHead className="text-start">{t('common.agency')}</TableHead>
                  <TableHead className="text-start">{t('common.period')}</TableHead>
                  <TableHead className="text-start">{t('common.amount')}</TableHead>
                  <TableHead className="text-start">{t('common.status')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-mono text-sm text-start">{payout.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium text-start">{payout.agency_name}</TableCell>
                    <TableCell className="text-start">
                      {formatDate(payout.period_start, "P")} - {formatDate(payout.period_end, "P")}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums text-start">{formatCurrency(payout.amount)}</TableCell>
                    <TableCell className="text-start">{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-end">
                      {payout.status === "pending" && (
                        <Button size="sm" onClick={() => handleProcessPayout(payout.id)}>
                          {t('financials.processPayout')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
