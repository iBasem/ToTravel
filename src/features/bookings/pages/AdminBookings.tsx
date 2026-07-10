import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
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
import { Search, Filter, MoreHorizontal, Eye, XCircle, RefreshCw, Download, Undo2, BookOpen, CheckCircle2, Clock, Calendar } from "lucide-react";
import {
  useAdminBookings,
  useCancelBooking,
  useRefundPayment,
  type AdminBooking,
} from "@/features/bookings/hooks/useAdminBookings";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDate, formatCurrency, formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/ui/page-header";
import { StatsGrid } from "@/ui/stats-card";
import { exportCsv } from "@/features/admin/lib/csv";

export default function AdminBookingManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, refetch } = useAdminBookings();
  const cancelBooking = useCancelBooking();
  const refundPayment = useRefundPayment();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [detailsBooking, setDetailsBooking] = useState<AdminBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null);
  const [refundTarget, setRefundTarget] = useState<{ paymentId: string; label: string; amount: number } | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const bookings = data?.bookings ?? [];
  const payments = data?.payments ?? [];
  const stats = data?.stats ?? { total: 0, confirmed: 0, pending: 0, thisMonth: 0 };

  const pkgTitle = (title: string, titleAr: string | null) => (isAr && titleAr ? titleAr : title);

  const bookingStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <Badge className={styles[status] ?? ""}>{t(`adminBookings.status.${status}`, status)}</Badge>;
  };

  const paymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      initiated: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    return <Badge className={styles[status] ?? ""}>{t(`adminBookings.paymentStatus.${status}`, status)}</Badge>;
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancelBooking.mutate(
      {
        bookingId: cancelTarget.id,
        packageTitle: cancelTarget.package_title,
        travelerName: cancelTarget.traveler_name,
      },
      {
        onSuccess: () => toast.success(t("adminBookings.cancelSuccess", "Booking cancelled")),
        onError: () => toast.error(t("adminBookings.cancelError", "Could not cancel booking")),
      },
    );
    setCancelTarget(null);
  };

  const handleRefund = () => {
    if (!refundTarget) return;
    refundPayment.mutate(
      { paymentId: refundTarget.paymentId, reason: refundReason },
      {
        onSuccess: () => toast.success(t("adminBookings.refundSuccess", "Refund issued through Moyasar")),
        onError: (error) =>
          toast.error(
            t("adminBookings.refundError", "Refund failed: {{reason}}", {
              reason: t(`serverErrors.${error.message}`, error.message),
            }),
          ),
      },
    );
    setRefundTarget(null);
    setRefundReason("");
  };

  const handleExport = () => {
    if (filteredBookings.length === 0) {
      toast.info(t("adminBookings.nothingToExport", "There are no bookings to export"));
      return;
    }
    exportCsv(
      `bookings-${new Date().toISOString().slice(0, 10)}`,
      filteredBookings.map((b) => ({
        id: b.id,
        package: b.package_title,
        traveler: b.traveler_name,
        traveler_email: b.traveler_email,
        agency: b.agency_name,
        booking_date: b.booking_date,
        participants: b.participants,
        total_sar: b.total_price,
        status: b.status,
        payment_status: b.payment_status,
        created: b.created_at,
      })),
    );
    toast.success(t("adminBookings.exportSuccess", "Bookings exported"));
  };

  const filteredBookings = bookings.filter((booking) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      booking.package_title.toLowerCase().includes(q) ||
      booking.traveler_name.toLowerCase().includes(q) ||
      booking.traveler_email.toLowerCase().includes(q) ||
      booking.agency_name.toLowerCase().includes(q) ||
      booking.id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((payment) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      payment.package_title.toLowerCase().includes(q) ||
      payment.traveler_name.toLowerCase().includes(q) ||
      payment.id.toLowerCase().includes(q) ||
      (payment.provider_invoice_id ?? "").toLowerCase().includes(q);
    const matchesStatus = paymentFilter === "all" || payment.status === paymentFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={t("adminBookings.loadErrorTitle", "Could not load bookings")}
        description={t("adminBookings.loadErrorDescription", "Something went wrong while loading bookings. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("adminBookings.title")}
        description={t("adminBookings.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center">
              <RefreshCw className="w-4 h-4 me-2" />
              {t("common.refresh")}
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 me-2" />
              {t("adminBookings.export", "Export bookings")}
            </Button>
          </>
        }
      />

      <StatsGrid
        stats={[
          { title: t("adminBookings.totalBookings"), value: formatNumber(stats.total), icon: BookOpen },
          { title: t("adminBookings.confirmedBookings", "Confirmed"), value: formatNumber(stats.confirmed), icon: CheckCircle2 },
          { title: t("common.pending"), value: formatNumber(stats.pending), icon: Clock },
          { title: t("adminBookings.thisMonth", "This month"), value: formatNumber(stats.thisMonth), icon: Calendar },
        ]}
      />

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">{t("adminBookings.bookingsTab", "Bookings")}</TabsTrigger>
          <TabsTrigger value="payments">{t("adminBookings.paymentsTab", "Payments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
                <CardTitle>{t("adminBookings.allBookings", "All bookings")}</CardTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="absolute top-1/2 -translate-y-1/2 text-muted-foreground/40 w-4 h-4 start-3" />
                    <Input
                      placeholder={t("adminBookings.searchPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-80 ps-10"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        {t("common.status")}: {statusFilter === "all" ? t("common.all") : t(`adminBookings.status.${statusFilter}`, statusFilter)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>{t("common.allStatus")}</DropdownMenuItem>
                      {(["pending", "confirmed", "completed", "cancelled"] as const).map((status) => (
                        <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                          {t(`adminBookings.status.${status}`, status)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>{t("adminBookings.noBookingsFound")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t("common.package")}</TableHead>
                      <TableHead className="text-start">{t("common.traveler")}</TableHead>
                      <TableHead className="text-start">{t("common.agency")}</TableHead>
                      <TableHead className="text-start">{t("adminBookings.bookingDate", "Travel date")}</TableHead>
                      <TableHead className="text-start">{t("common.total", "Total")}</TableHead>
                      <TableHead className="text-start">{t("common.status")}</TableHead>
                      <TableHead className="text-start">{t("adminBookings.payment", "Payment")}</TableHead>
                      <TableHead className="text-end">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="text-start">
                          <div className="font-medium">{pkgTitle(booking.package_title, booking.package_title_ar)}</div>
                          <div className="text-sm text-muted-foreground font-mono">{booking.id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell className="text-start">
                          <div>{booking.traveler_name || "—"}</div>
                          <div className="text-sm text-muted-foreground">{booking.traveler_email}</div>
                        </TableCell>
                        <TableCell className="text-start">{booking.agency_name || "—"}</TableCell>
                        <TableCell className="text-start">{formatDate(booking.booking_date, "P")}</TableCell>
                        <TableCell className="tabular-nums text-start">{formatCurrency(booking.total_price)}</TableCell>
                        <TableCell className="text-start">{bookingStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-start">{paymentStatusBadge(booking.payment_status)}</TableCell>
                        <TableCell className="text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? "start" : "end"}>
                              <DropdownMenuItem onClick={() => setDetailsBooking(booking)}>
                                <Eye className="w-4 h-4 me-2" />
                                {t("adminBookings.viewDetails", "View details")}
                              </DropdownMenuItem>
                              {booking.paid_payment_id && booking.payment_status === "paid" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setRefundTarget({
                                      paymentId: booking.paid_payment_id!,
                                      label: `${booking.package_title} — ${booking.traveler_name}`,
                                      amount: booking.total_price,
                                    })
                                  }
                                >
                                  <Undo2 className="w-4 h-4 me-2" />
                                  {t("adminBookings.processRefund", "Refund payment")}
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "cancelled" && booking.status !== "completed" && booking.payment_status !== "paid" && (
                                <DropdownMenuItem className="text-destructive" onClick={() => setCancelTarget(booking)}>
                                  <XCircle className="w-4 h-4 me-2" />
                                  {t("adminBookings.cancelBooking", "Cancel booking")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
                <CardTitle>{t("adminBookings.allPayments", "All payments (Moyasar)")}</CardTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="absolute top-1/2 -translate-y-1/2 text-muted-foreground/40 w-4 h-4 start-3" />
                    <Input
                      placeholder={t("adminBookings.searchPayments", "Search payments...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-80 ps-10"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        {t("common.status")}: {paymentFilter === "all" ? t("common.all") : t(`adminBookings.paymentStatus.${paymentFilter}`, paymentFilter)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setPaymentFilter("all")}>{t("common.allStatus")}</DropdownMenuItem>
                      {(["initiated", "paid", "failed", "refunded"] as const).map((status) => (
                        <DropdownMenuItem key={status} onClick={() => setPaymentFilter(status)}>
                          {t(`adminBookings.paymentStatus.${status}`, status)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>{t("adminBookings.noPaymentsFound", "No payments found")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t("adminBookings.paymentId", "Payment")}</TableHead>
                      <TableHead className="text-start">{t("common.package")}</TableHead>
                      <TableHead className="text-start">{t("common.traveler")}</TableHead>
                      <TableHead className="text-start">{t("adminBookings.amount", "Amount")}</TableHead>
                      <TableHead className="text-start">{t("adminBookings.providerRef", "Provider ref")}</TableHead>
                      <TableHead className="text-start">{t("common.date", "Date")}</TableHead>
                      <TableHead className="text-start">{t("common.status")}</TableHead>
                      <TableHead className="text-end">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm text-start">{payment.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-start">{pkgTitle(payment.package_title, payment.package_title_ar) || "—"}</TableCell>
                        <TableCell className="text-start">{payment.traveler_name || "—"}</TableCell>
                        <TableCell className="tabular-nums text-start">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="font-mono text-xs text-start" dir="ltr">
                          {payment.provider_payment_id ?? payment.provider_invoice_id ?? "—"}
                        </TableCell>
                        <TableCell className="text-start">{formatDate(payment.created_at, "P")}</TableCell>
                        <TableCell className="text-start">{paymentStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-end">
                          {payment.status === "paid" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setRefundTarget({
                                  paymentId: payment.id,
                                  label: `${payment.package_title} — ${payment.traveler_name}`,
                                  amount: payment.amount,
                                })
                              }
                            >
                              <Undo2 className="w-4 h-4 me-1" />
                              {t("adminBookings.refund", "Refund")}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking details */}
      <Dialog open={!!detailsBooking} onOpenChange={(open) => !open && setDetailsBooking(null)}>
        <DialogContent className="max-w-lg">
          {detailsBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-start">{pkgTitle(detailsBooking.package_title, detailsBooking.package_title_ar)}</DialogTitle>
                <DialogDescription className="text-start font-mono">{detailsBooking.id}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="text-muted-foreground text-start">{t("common.traveler")}</div>
                <div className="text-start">
                  {detailsBooking.traveler_name}
                  <div className="text-muted-foreground">{detailsBooking.traveler_email}</div>
                </div>
                <div className="text-muted-foreground text-start">{t("common.agency")}</div>
                <div className="text-start">{detailsBooking.agency_name || "—"}</div>
                <div className="text-muted-foreground text-start">{t("adminBookings.bookingDate", "Travel date")}</div>
                <div className="text-start">{formatDate(detailsBooking.booking_date, "PPP")}</div>
                <div className="text-muted-foreground text-start">{t("adminBookings.participants", "Participants")}</div>
                <div className="text-start tabular-nums">{detailsBooking.participants}</div>
                <div className="text-muted-foreground text-start">{t("common.total", "Total")}</div>
                <div className="text-start tabular-nums font-medium">{formatCurrency(detailsBooking.total_price)}</div>
                <div className="text-muted-foreground text-start">{t("common.status")}</div>
                <div className="text-start">{bookingStatusBadge(detailsBooking.status)}</div>
                <div className="text-muted-foreground text-start">{t("adminBookings.payment", "Payment")}</div>
                <div className="text-start">{paymentStatusBadge(detailsBooking.payment_status)}</div>
                <div className="text-muted-foreground text-start">{t("adminBookings.booked", "Booked")}</div>
                <div className="text-start">{formatDate(detailsBooking.created_at, "PPp")}</div>
                {detailsBooking.special_requests && (
                  <>
                    <div className="text-muted-foreground text-start">{t("adminBookings.specialRequests", "Special requests")}</div>
                    <div className="text-start">{detailsBooking.special_requests}</div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adminBookings.confirmCancelTitle", "Cancel this booking?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("adminBookings.confirmCancelDesc", "The booking will be marked as cancelled. This does not refund any payment.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("adminBookings.cancelBooking", "Cancel booking")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund confirmation */}
      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRefundTarget(null);
            setRefundReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          {refundTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-start">{t("adminBookings.confirmRefundTitle", "Refund this payment?")}</DialogTitle>
                <DialogDescription className="text-start">
                  {t("adminBookings.confirmRefundDesc", "{{label}} — {{amount}} will be refunded through Moyasar. This cannot be undone.", {
                    label: refundTarget.label,
                    amount: formatCurrency(refundTarget.amount),
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="refund-reason" className="text-start block">
                  {t("adminBookings.refundReason", "Reason (optional)")}
                </Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRefundTarget(null);
                    setRefundReason("");
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="destructive" onClick={handleRefund} disabled={refundPayment.isPending}>
                  {refundPayment.isPending ? t("adminBookings.refunding", "Refunding…") : t("adminBookings.refund", "Refund")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
