import { useState } from "react";
import { shortId, displayName, initials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
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
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Search, Filter, MoreHorizontal, Eye, UserX, UserCheck, RefreshCw, Download, Phone, Users, TrendingUp } from "lucide-react";
import {
  useAdminTravelers,
  useUpdateTravelerStatus,
  useTravelerBookings,
  type AdminTraveler,
} from "@/features/admin/hooks/useAdminTravelers";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber, formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/ui/page-header";
import { StatsGrid } from "@/ui/stats-card";
import { exportCsv } from "@/features/admin/lib/csv";

export default function TravelerManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { data, isLoading, isError, refetch } = useAdminTravelers();
  const updateStatus = useUpdateTravelerStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileTraveler, setProfileTraveler] = useState<AdminTraveler | null>(null);

  const travelers = data?.travelers ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, suspended: 0, newThisMonth: 0 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t("common.active")}</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{t("common.suspended")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = (traveler: AdminTraveler, newStatus: "active" | "suspended") => {
    updateStatus.mutate(
      {
        travelerId: traveler.id,
        travelerName: `${traveler.first_name} ${traveler.last_name}`,
        status: newStatus,
      },
      {
        onSuccess: () =>
          toast.success(
            t("travelers.statusUpdateSuccess", {
              status: newStatus === "active" ? t("common.active") : t("common.suspended"),
            }),
          ),
        onError: () => toast.error(t("travelers.statusUpdateError")),
      },
    );
  };

  const handleExport = () => {
    if (filteredTravelers.length === 0) {
      toast.info(t("travelers.nothingToExport", "There are no travelers to export"));
      return;
    }
    exportCsv(
      `travelers-${new Date().toISOString().slice(0, 10)}`,
      filteredTravelers.map((tr) => ({
        id: tr.id,
        first_name: tr.first_name,
        last_name: tr.last_name,
        email: tr.email,
        phone: tr.phone ?? "",
        status: tr.status,
        bookings: tr.bookings_count,
        registered: tr.created_at,
      })),
    );
    toast.success(t("travelers.exportSuccess", "Travelers exported"));
  };

  const filteredTravelers = travelers.filter((traveler) => {
    const fullName = `${traveler.first_name} ${traveler.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      traveler.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      traveler.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || traveler.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
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
        title={t("travelers.loadErrorTitle", "Could not load travelers")}
        description={t("travelers.loadErrorDescription", "Something went wrong while loading travelers. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("travelers.management")}
        description={t("travelers.manageAll")}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center">
              <RefreshCw className="w-4 h-4 me-1 sm:me-2" />
              {t("common.refresh")}
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 me-1 sm:me-2" />
              {t("travelers.exportData")}
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <StatsGrid
        stats={[
          { title: t("travelers.totalTravelers"), value: formatNumber(stats.total), icon: Users },
          { title: t("travelers.activeUsers"), value: formatNumber(stats.active), icon: UserCheck },
          { title: t("common.suspended"), value: formatNumber(stats.suspended), icon: UserX },
          { title: t("travelers.newThisMonth"), value: formatNumber(stats.newThisMonth), icon: TrendingUp },
        ]}
      />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <CardTitle>{t("travelers.allTravelers")}</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground/40 w-4 h-4 start-3" />
                <Input
                  placeholder={t("travelers.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 ps-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t("common.status")}: {statusFilter === "all" ? t("common.all") : statusFilter === "active" ? t("common.active") : t("common.suspended")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>{t("common.allStatus")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>{t("common.active")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>{t("common.suspended")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTravelers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("travelers.noTravelersFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("common.traveler")}</TableHead>
                  <TableHead className="text-start">{t("travelers.userId")}</TableHead>
                  <TableHead className="text-start">{t("travelers.registrationDate")}</TableHead>
                  <TableHead className="text-start">{t("travelers.totalBookings")}</TableHead>
                  <TableHead className="text-start">{t("common.status")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTravelers.map((traveler) => (
                  <TableRow key={traveler.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={traveler.avatar_url || undefined} />
                          <AvatarFallback>
                            {initials(`${traveler.first_name ?? ""} ${traveler.last_name ?? ""}`.trim() || traveler.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-start">
                          <div className="font-medium">
                            {displayName({ full_name: `${traveler.first_name ?? ""} ${traveler.last_name ?? ""}`.trim(), email: traveler.email })}
                          </div>
                          <div className="text-sm text-muted-foreground">{traveler.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-start">{shortId(traveler.id)}</TableCell>
                    <TableCell className="text-start">{formatDate(traveler.created_at, "P")}</TableCell>
                    <TableCell className="text-start">{traveler.bookings_count}</TableCell>
                    <TableCell className="text-start">{getStatusBadge(traveler.status)}</TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t("common.actions", "Actions")}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          <DropdownMenuItem onClick={() => setProfileTraveler(traveler)}>
                            <Eye className="w-4 h-4 me-2" />
                            {t("common.viewProfile")}
                          </DropdownMenuItem>
                          {traveler.status === "active" ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleStatusChange(traveler, "suspended")}
                            >
                              <UserX className="w-4 h-4 me-2" />
                              {t("common.suspendUser")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600 dark:text-green-400"
                              onClick={() => handleStatusChange(traveler, "active")}
                            >
                              <UserCheck className="w-4 h-4 me-2" />
                              {t("common.activateUser")}
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

      <TravelerProfileDialog traveler={profileTraveler} onClose={() => setProfileTraveler(null)} />
    </div>
  );
}

function TravelerProfileDialog({ traveler, onClose }: { traveler: AdminTraveler | null; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: bookings, isLoading } = useTravelerBookings(traveler?.id ?? null);

  const bookingStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <Badge className={styles[status] ?? ""}>{t(`adminBookings.status.${status}`, status)}</Badge>;
  };

  return (
    <Dialog open={!!traveler} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {traveler && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-start">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={traveler.avatar_url || undefined} />
                  <AvatarFallback>
                    {initials(`${traveler.first_name ?? ""} ${traveler.last_name ?? ""}`.trim() || traveler.email)}
                  </AvatarFallback>
                </Avatar>
                {displayName({ full_name: `${traveler.first_name ?? ""} ${traveler.last_name ?? ""}`.trim(), email: traveler.email })}
              </DialogTitle>
              <DialogDescription className="text-start">{traveler.email}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span dir="ltr">{traveler.phone || "—"}</span>
              </div>
              <div>
                {t("travelers.registrationDate")}: {formatDate(traveler.created_at, "P")}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-start">
                {t("travelers.bookingsHeading", "Bookings")} ({traveler.bookings_count})
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !bookings || bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-start">{t("travelers.noBookings", "This traveler has no bookings yet.")}</p>
              ) : (
                <div className="border rounded-md divide-y">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="text-start min-w-0">
                        <div className="font-medium truncate">
                          {isAr && booking.package_title_ar ? booking.package_title_ar : booking.package_title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(booking.booking_date, "P")} · {booking.participants} {t("travelers.participants", "participants")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm tabular-nums">{formatCurrency(booking.total_price)}</span>
                        {bookingStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
