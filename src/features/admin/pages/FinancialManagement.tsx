import { useState } from "react";
import { shortId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { DollarSign, TrendingUp, CreditCard, Building2, RefreshCw, Download, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/ui/page-header";
import { StatsGrid } from "@/ui/stats-card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAdminFinancials, useProcessPayouts, type AdminPayout } from "@/features/admin/hooks/useAdminFinancials";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { exportCsv } from "@/features/admin/lib/csv";

interface ProcessTarget {
  payouts: AdminPayout[];
}

export default function FinancialManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { data, isLoading, isError, refetch } = useAdminFinancials();
  const processPayouts = useProcessPayouts();
  const [processTarget, setProcessTarget] = useState<ProcessTarget | null>(null);
  const [paymentReference, setPaymentReference] = useState("");

  const payouts = data?.payouts ?? [];
  const stats = data?.stats ?? {
    totalRevenue: 0,
    platformCommission: 0,
    pendingPayouts: 0,
    processedPayouts: 0,
    pendingPayoutsCount: 0,
  };
  const revenueData = data?.revenueData ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t("common.processed")}</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t("financials.processing", "Processing")}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t("common.pending")}</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{t("common.failed")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openProcessDialog = (target: AdminPayout[]) => {
    if (target.length === 0) {
      toast.info(t("financials.noPendingPayouts"));
      return;
    }
    setPaymentReference("");
    setProcessTarget({ payouts: target });
  };

  const handleConfirmProcess = () => {
    if (!processTarget) return;
    const ids = processTarget.payouts.map((p) => p.id);
    const total = processTarget.payouts.reduce((s, p) => s + p.amount, 0);
    processPayouts.mutate(
      {
        payoutIds: ids,
        paymentReference: paymentReference.trim(),
        agencyNames: [...new Set(processTarget.payouts.map((p) => p.agency_name))],
        totalAmount: total,
      },
      {
        onSuccess: () =>
          toast.success(
            ids.length === 1
              ? t("financials.payoutSuccess")
              : t("financials.batchPayoutSuccess", { count: ids.length }),
          ),
        onError: () =>
          toast.error(ids.length === 1 ? t("financials.payoutError") : t("financials.batchPayoutError")),
      },
    );
    setProcessTarget(null);
  };

  const handleExportReport = () => {
    if (payouts.length === 0 && revenueData.length === 0) {
      toast.info(t("financials.nothingToExport", "There is no financial data to export"));
      return;
    }
    exportCsv(
      `financial-report-${new Date().toISOString().slice(0, 10)}`,
      payouts.map((p) => ({
        payout_id: p.id,
        agency: p.agency_name,
        period_start: p.period_start,
        period_end: p.period_end,
        amount_sar: p.amount,
        commission_rate: p.commission_rate,
        status: p.status,
        processed_at: p.processed_at ?? "",
        payment_reference: p.payment_reference ?? "",
      })),
    );
    toast.success(t("financials.reportExported", "Financial report exported"));
  };

  if (isLoading) {
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

  if (isError) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={t("financials.loadErrorTitle", "Could not load financial data")}
        description={t("financials.loadErrorDescription", "Something went wrong while loading financial data. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  const pendingPayouts = payouts.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("financials.title")}
        description={t("financials.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center">
              <RefreshCw className="w-4 h-4 me-2" />
              {t("common.refresh")}
            </Button>
            <Button onClick={handleExportReport}>
              <Download className="w-4 h-4 me-2" />
              {t("financials.generateReport")}
            </Button>
          </>
        }
      />

      <StatsGrid
        stats={[
          {
            title: t("financials.totalRevenue"),
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            footer: (
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 me-1" aria-hidden="true" />
                {t("financials.fromConfirmedBookings")}
              </div>
            ),
          },
          {
            title: t("financials.platformCommission"),
            value: formatCurrency(stats.platformCommission),
            icon: CreditCard,
            description: t("financials.commissionRateDesc"),
          },
          {
            title: t("financials.pendingPayouts"),
            value: formatCurrency(stats.pendingPayouts),
            icon: Building2,
            description: `${stats.pendingPayoutsCount} ${t("financials.agenciesPending")}`,
          },
          {
            title: t("financials.processedPayouts"),
            value: formatCurrency(stats.processedPayouts),
            icon: CheckCircle2,
            description: t("financials.totalProcessed"),
          },
        ]}
      />

      <Card>
        <CardHeader className="text-start">
          <CardTitle>{t("financials.revenueOverview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80" dir="ltr">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis orientation={isRTL ? "right" : "left"} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name={t("financials.totalRevenue")} />
                  <Line type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} name={t("financials.platformCommission")} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t("financials.noRevenueData")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("financials.agencyPayouts")}</CardTitle>
            <Button onClick={() => openProcessDialog(pendingPayouts)}>{t("financials.processAllPending")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("financials.noPayoutsFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("financials.payoutId")}</TableHead>
                  <TableHead className="text-start">{t("common.agency")}</TableHead>
                  <TableHead className="text-start">{t("common.period")}</TableHead>
                  <TableHead className="text-start">{t("common.amount")}</TableHead>
                  <TableHead className="text-start">{t("financials.paymentReference", "Reference")}</TableHead>
                  <TableHead className="text-start">{t("common.status")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-mono text-sm text-start">{shortId(payout.id)}</TableCell>
                    <TableCell className="font-medium text-start">{payout.agency_name || "—"}</TableCell>
                    <TableCell className="text-start">
                      {formatDate(payout.period_start, "P")} - {formatDate(payout.period_end, "P")}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums text-start">{formatCurrency(payout.amount)}</TableCell>
                    <TableCell className="font-mono text-xs text-start" dir="ltr">
                      {payout.payment_reference ?? "—"}
                    </TableCell>
                    <TableCell className="text-start">{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-end">
                      {payout.status === "pending" && (
                        <Button size="sm" onClick={() => openProcessDialog([payout])}>
                          {t("financials.processPayout")}
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

      {/* Process payout dialog — records the bank transfer reference */}
      <Dialog open={!!processTarget} onOpenChange={(open) => !open && setProcessTarget(null)}>
        <DialogContent className="max-w-md">
          {processTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-start">
                  {processTarget.payouts.length === 1
                    ? t("financials.confirmProcessTitle", "Mark payout as processed?")
                    : t("financials.confirmProcessAllTitle", "Mark {{count}} payouts as processed?", {
                        count: processTarget.payouts.length,
                      })}
                </DialogTitle>
                <DialogDescription className="text-start">
                  {t("financials.confirmProcessDesc", "Total {{amount}}. Record this only after the bank transfer has been made — this does not move money.", {
                    amount: formatCurrency(processTarget.payouts.reduce((s, p) => s + p.amount, 0)),
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="payment-reference" className="text-start block">
                  {t("financials.paymentReferenceLabel", "Payment reference (bank transfer ID)")}
                </Label>
                <Input
                  id="payment-reference"
                  dir="ltr"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={t("financials.paymentReferencePlaceholder", "e.g. TRF-2026-00123")}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProcessTarget(null)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleConfirmProcess} disabled={processPayouts.isPending}>
                  {processPayouts.isPending ? t("common.saving", "Saving…") : t("financials.processPayout")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
