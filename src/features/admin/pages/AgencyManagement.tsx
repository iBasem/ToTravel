import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
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
  Search, Filter, MoreHorizontal, Eye, Edit, CheckCircle, XCircle,
  Building2, RefreshCw, Ban, RotateCcw, Star, Globe, Phone, MapPin, FileBadge,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  useAdminAgencies,
  useUpdateAgencyStatus,
  useUpdateAgencyCommission,
  useAgencyPackages,
  type AdminAgency,
} from "@/features/admin/hooks/useAdminAgencies";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDate, formatNumber, formatCurrency } from "@/lib/formatters";

type StatusFilter = "all" | "active" | "pending" | "rejected" | "suspended";

interface CommissionForm {
  commission_percent: number;
}

export default function AgencyManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { data, isLoading, isError, refetch } = useAdminAgencies();
  const updateStatus = useUpdateAgencyStatus();
  const updateCommission = useUpdateAgencyCommission();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [profileAgency, setProfileAgency] = useState<AdminAgency | null>(null);
  const [editAgency, setEditAgency] = useState<AdminAgency | null>(null);

  const agencies = data?.agencies ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, pending: 0, totalPackages: 0 };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (status === "active" || isVerified) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t("common.active", "Active")}</Badge>;
    }
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t("common.pending")}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{t("common.rejected")}</Badge>;
      case "suspended":
        return <Badge className="bg-muted text-muted-foreground">{t("common.suspended")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const changeStatus = (
    agency: AdminAgency,
    status: AdminAgency["status"],
    isVerified: boolean | undefined,
    successKey: string,
    errorKey: string,
  ) => {
    updateStatus.mutate(
      { agencyId: agency.id, companyName: agency.company_name, status, isVerified },
      {
        onSuccess: () => toast.success(t(successKey)),
        onError: () => toast.error(t(errorKey)),
      },
    );
  };

  const filteredAgencies = agencies.filter((agency) => {
    const contactPerson = `${agency.contact_person_first_name} ${agency.contact_person_last_name}`.toLowerCase();
    const matchesSearch =
      agency.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactPerson.includes(searchTerm.toLowerCase()) ||
      agency.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || agency.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-72 mb-2" />
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
        icon="AlertTriangle"
        title={t("agencyManagement.loadErrorTitle", "Could not load agencies")}
        description={t("agencyManagement.loadErrorDescription", "Something went wrong while loading agencies. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="text-start">
          <h1 className="text-3xl font-bold">{t("agencyManagement.title")}</h1>
          <p className="text-muted-foreground">{t("agencyManagement.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} className="flex items-center">
            <RefreshCw className="w-4 h-4 me-2" />
            {t("common.refresh")}
          </Button>
          <Button onClick={() => setStatusFilter("pending")}>
            {t("agencyManagement.applications")}
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ms-2">{stats.pending}</Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t("agencyManagement.totalAgencies"), value: stats.total },
          { label: t("common.active", "Active"), value: stats.active },
          { label: t("agencyManagement.pendingApproval"), value: stats.pending },
          { label: t("agencyManagement.totalToursListed"), value: formatNumber(stats.totalPackages) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2 text-start">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <CardTitle>{t("agencyManagement.allAgencies")}</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground/40 w-4 h-4 start-3" />
                <Input
                  placeholder={t("agencyManagement.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 ps-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t("common.status")}: {statusFilter === "all" ? t("common.all") : t(`common.${statusFilter}`, statusFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>{t("common.allStatus")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>{t("common.active", "Active")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>{t("common.pending")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>{t("common.rejected")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>{t("common.suspended")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAgencies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("agencyManagement.noAgenciesFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("common.agency")}</TableHead>
                  <TableHead className="text-start">{t("agencyManagement.agencyId")}</TableHead>
                  <TableHead className="text-start">{t("agencyManagement.contactPerson")}</TableHead>
                  <TableHead className="text-start">{t("agencyManagement.registrationDate")}</TableHead>
                  <TableHead className="text-start">{t("agencyManagement.toursListed")}</TableHead>
                  <TableHead className="text-start">{t("agencyManagement.commission")}</TableHead>
                  <TableHead className="text-start">{t("common.status")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-start">
                          <div className="font-medium">{agency.company_name}</div>
                          <div className="text-sm text-muted-foreground">{agency.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-start">{agency.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-start">
                      {agency.contact_person_first_name} {agency.contact_person_last_name}
                    </TableCell>
                    <TableCell className="text-start">{formatDate(agency.created_at, "P")}</TableCell>
                    <TableCell className="text-start font-medium">{agency.packages_count}</TableCell>
                    <TableCell className="tabular-nums text-start">{(agency.commission_rate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-start">{getStatusBadge(agency.status, agency.is_verified)}</TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t("common.actions", "Actions")}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          <DropdownMenuItem onClick={() => setProfileAgency(agency)}>
                            <Eye className="w-4 h-4 me-2" />
                            {t("common.viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditAgency(agency)}>
                            <Edit className="w-4 h-4 me-2" />
                            {t("common.editDetails")}
                          </DropdownMenuItem>
                          {agency.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => changeStatus(agency, "active", true, "agencyManagement.approveSuccess", "agencyManagement.approveError")}
                              >
                                <CheckCircle className="w-4 h-4 me-2" />
                                {t("agencyManagement.approveBtn")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => changeStatus(agency, "rejected", false, "agencyManagement.rejectSuccess", "agencyManagement.rejectError")}
                              >
                                <XCircle className="w-4 h-4 me-2" />
                                {t("agencyManagement.rejectBtn")}
                              </DropdownMenuItem>
                            </>
                          )}
                          {agency.status === "active" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => changeStatus(agency, "suspended", undefined, "agencyManagement.suspendSuccess", "agencyManagement.suspendError")}
                            >
                              <Ban className="w-4 h-4 me-2" />
                              {t("agencyManagement.suspendBtn", "Suspend")}
                            </DropdownMenuItem>
                          )}
                          {(agency.status === "suspended" || agency.status === "rejected") && (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => changeStatus(agency, "active", true, "agencyManagement.reactivateSuccess", "agencyManagement.reactivateError")}
                            >
                              <RotateCcw className="w-4 h-4 me-2" />
                              {t("agencyManagement.reactivateBtn", "Reactivate")}
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

      <AgencyProfileDialog agency={profileAgency} onClose={() => setProfileAgency(null)} />
      <AgencyEditDialog
        agency={editAgency}
        onClose={() => setEditAgency(null)}
        onSave={(agency, percent) =>
          updateCommission.mutate(
            { agencyId: agency.id, companyName: agency.company_name, commission_rate: percent / 100 },
            {
              onSuccess: () => {
                toast.success(t("agencyManagement.commissionSaved", "Commission rate updated"));
                setEditAgency(null);
              },
              onError: () => toast.error(t("agencyManagement.commissionError", "Could not update commission rate")),
            },
          )
        }
        saving={updateCommission.isPending}
      />
    </div>
  );
}

function AgencyProfileDialog({ agency, onClose }: { agency: AdminAgency | null; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: packages, isLoading } = useAgencyPackages(agency?.id ?? null);

  return (
    <Dialog open={!!agency} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {agency && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-start">
                <Building2 className="w-5 h-5 text-primary" />
                {agency.company_name}
              </DialogTitle>
              <DialogDescription className="text-start">
                {agency.company_description || t("agencyManagement.noDescription", "No description provided.")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-start">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span dir="ltr">{agency.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-start">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <span dir="ltr">{agency.website || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-start">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{[agency.city, agency.country].filter(Boolean).join(", ") || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-start">
                <FileBadge className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{agency.license_number || t("agencyManagement.noLicense", "No license number")}</span>
              </div>
              <div className="flex items-center gap-2 text-start">
                <Star className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="tabular-nums">
                  {agency.rating.toFixed(1)} ({formatNumber(agency.total_reviews)} {t("agencyManagement.reviews", "reviews")})
                </span>
              </div>
              <div className="flex items-center gap-2 text-start">
                <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  {t("agencyManagement.commission")}: <span className="tabular-nums">{(agency.commission_rate * 100).toFixed(1)}%</span>
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-start">
                {t("agencyManagement.agencyPackages", "Packages")} ({agency.packages_count})
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !packages || packages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-start">{t("agencyManagement.noPackages", "This agency has no packages yet.")}</p>
              ) : (
                <div className="border rounded-md divide-y">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="text-start min-w-0">
                        <div className="font-medium truncate">{isAr && pkg.title_ar ? pkg.title_ar : pkg.title}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(pkg.created_at, "P")}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm tabular-nums">{formatCurrency(pkg.base_price)}</span>
                        <Badge variant="outline">{t(`adminPackages.status.${pkg.status}`, pkg.status)}</Badge>
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

function AgencyEditDialog({
  agency,
  onClose,
  onSave,
  saving,
}: {
  agency: AdminAgency | null;
  onClose: () => void;
  onSave: (agency: AdminAgency, commissionPercent: number) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CommissionForm>({
    values: agency ? { commission_percent: Number((agency.commission_rate * 100).toFixed(1)) } : undefined,
  });

  return (
    <Dialog open={!!agency} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {agency && (
          <form onSubmit={handleSubmit((values) => onSave(agency, Number(values.commission_percent)))}>
            <DialogHeader>
              <DialogTitle className="text-start">{t("agencyManagement.editTitle", "Edit agency")}</DialogTitle>
              <DialogDescription className="text-start">{agency.company_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="commission_percent" className="text-start block">
                {t("agencyManagement.commissionRatePercent", "Commission rate (%)")}
              </Label>
              <Input
                id="commission_percent"
                type="number"
                step="0.1"
                dir="ltr"
                {...register("commission_percent", {
                  required: t("agencyManagement.commissionRequired", "Commission rate is required"),
                  min: { value: 0, message: t("agencyManagement.commissionRange", "Must be between 0 and 100") },
                  max: { value: 100, message: t("agencyManagement.commissionRange", "Must be between 0 and 100") },
                })}
              />
              {errors.commission_percent && (
                <p className="text-sm text-destructive text-start">{errors.commission_percent.message}</p>
              )}
              <p className="text-xs text-muted-foreground text-start">
                {t("agencyManagement.commissionHint", "Platform share of each booking for this agency. Overrides the platform default.")}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving", "Saving…") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
