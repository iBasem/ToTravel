import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
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
import { Search, Filter, MoreHorizontal, Eye, Star, RefreshCw, CheckCircle2, XCircle, Ban, Archive, RotateCcw, Clock, Package as PackageIcon } from "lucide-react";
import {
  useAdminPackages,
  type AdminPackage,
  type PackageStatus,
} from "@/features/packages/hooks/useAdminPackages";
import {
  useUpdateAdminPackageStatus,
  useToggleAdminPackageFeatured,
  type PackageModerationAction,
} from "@/features/admin/hooks/useAdminPackageDetails";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/formatters";

import { PageHeader } from "@/ui/page-header";
import { StatsGrid } from "@/ui/stats-card";

type StatusFilter = "all" | PackageStatus;

export default function AdminPackageManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isAr = i18n.language === "ar";
  const { data, isLoading, isError, refetch } = useAdminPackages();
  const updateStatus = useUpdateAdminPackageStatus();
  const toggleFeatured = useToggleAdminPackageFeatured();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const packages = data?.packages ?? [];
  const stats = data?.stats ?? { total: 0, live: 0, pending: 0, featured: 0 };

  const getStatusBadge = (status: PackageStatus) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t("common.live")}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t("common.pending")}</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{t("common.suspended")}</Badge>;
      case "archived":
        return <Badge variant="outline">{t("adminPackages.status.archived", "Archived")}</Badge>;
      case "draft":
        return <Badge className="bg-muted text-muted-foreground">{t("common.draft")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleToggleFeatured = (pkg: AdminPackage) => {
    toggleFeatured.mutate(
      { packageId: pkg.id, title: pkg.title, featured: !pkg.featured },
      {
        onSuccess: () =>
          toast.success(pkg.featured ? t("adminPackages.removedFeatured") : t("adminPackages.markedFeatured")),
        onError: () => toast.error(t("common.updateError")),
      },
    );
  };

  const handleModeration = (pkg: AdminPackage, action: PackageModerationAction, successMessage: string) => {
    updateStatus.mutate(
      { packageId: pkg.id, title: pkg.title, action },
      {
        onSuccess: () => toast.success(successMessage),
        onError: () => toast.error(t("common.updateError")),
      },
    );
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.title_ar ?? "").includes(searchTerm) ||
      pkg.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.agency_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-start">
            <Skeleton className="h-8 w-64 mb-2" />
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

  if (isError) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={t("adminPackages.loadErrorTitle", "Could not load packages")}
        description={t("adminPackages.loadErrorDescription", "Something went wrong while loading packages. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("adminPackages.title")}
        description={t("adminPackages.subtitle")}
        actions={
          <Button variant="outline" onClick={() => refetch()} className="flex items-center">
            <RefreshCw className="w-4 h-4 me-2" />
            {t("common.refresh")}
          </Button>
        }
      />

      <StatsGrid
        stats={[
          { title: t("adminPackages.totalPackages"), value: formatNumber(stats.total), icon: PackageIcon },
          { title: t("adminPackages.livePackages"), value: formatNumber(stats.live), icon: CheckCircle2 },
          { title: t("adminPackages.pendingReview"), value: formatNumber(stats.pending), icon: Clock },
          { title: t("common.featured"), value: formatNumber(stats.featured), icon: Star },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <CardTitle>{t("adminPackages.allPackages")}</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 start-3" />
                <Input
                  placeholder={t("adminPackages.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 ps-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t("common.status")}: {statusFilter === "all" ? t("common.all") : t(`adminPackages.status.${statusFilter}`, statusFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>{t("common.allStatus")}</DropdownMenuItem>
                  {(["pending", "published", "draft", "suspended", "archived"] as const).map((status) => (
                    <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                      {t(`adminPackages.status.${status}`, status)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPackages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("adminPackages.noPackagesFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("common.package")}</TableHead>
                  <TableHead className="text-start">{t("common.agency")}</TableHead>
                  <TableHead className="text-start">{t("common.destination")}</TableHead>
                  <TableHead className="text-start">{t("common.price")}</TableHead>
                  <TableHead className="text-start">{t("common.duration")}</TableHead>
                  <TableHead className="text-start">{t("common.status")}</TableHead>
                  <TableHead className="text-start">{t("common.featured")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="text-start">
                      <Link to={`/admin/packages/${pkg.id}`} className="font-medium text-foreground hover:underline">
                        {isAr && pkg.title_ar ? pkg.title_ar : pkg.title}
                      </Link>
                      <div className="text-sm text-muted-foreground tabular-nums">{pkg.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell className="text-start">{pkg.agency_name || "—"}</TableCell>
                    <TableCell className="text-start">{isAr && pkg.destination_ar ? pkg.destination_ar : pkg.destination}</TableCell>
                    <TableCell className="font-medium tabular-nums text-start">{formatCurrency(pkg.base_price)}</TableCell>
                    <TableCell className="tabular-nums text-start">
                      {pkg.duration_days} {t("common.days")}
                    </TableCell>
                    <TableCell className="text-start">{getStatusBadge(pkg.status)}</TableCell>
                    <TableCell className="text-start">
                      <button
                        type="button"
                        aria-label={pkg.featured ? t("adminPackages.removeFeatured") : t("adminPackages.makeFeatured")}
                        onClick={() => handleToggleFeatured(pkg)}
                      >
                        {pkg.featured ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <Star className="w-4 h-4 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/packages/${pkg.id}`}>
                              <Eye className="w-4 h-4 me-2" />
                              {t("adminPackages.viewPackage")}
                            </Link>
                          </DropdownMenuItem>
                          {pkg.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleModeration(pkg, "approve", t("adminPackages.approved", "Package approved and published"))}
                              >
                                <CheckCircle2 className="w-4 h-4 me-2 text-green-600" />
                                {t("adminPackages.approve", "Approve & publish")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleModeration(pkg, "reject", t("adminPackages.rejected", "Package sent back to draft"))}
                              >
                                <XCircle className="w-4 h-4 me-2 text-destructive" />
                                {t("adminPackages.reject", "Reject (send to draft)")}
                              </DropdownMenuItem>
                            </>
                          )}
                          {pkg.status === "published" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleModeration(pkg, "suspend", t("adminPackages.suspended", "Package suspended"))}
                              >
                                <Ban className="w-4 h-4 me-2 text-destructive" />
                                {t("adminPackages.suspend", "Suspend")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleModeration(pkg, "unpublish", t("adminPackages.unpublished", "Package unpublished"))}
                              >
                                <XCircle className="w-4 h-4 me-2" />
                                {t("adminPackages.unpublish", "Unpublish")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleModeration(pkg, "archive", t("adminPackages.archived", "Package archived"))}
                              >
                                <Archive className="w-4 h-4 me-2" />
                                {t("adminPackages.archive", "Archive")}
                              </DropdownMenuItem>
                            </>
                          )}
                          {pkg.status === "suspended" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleModeration(pkg, "republish", t("adminPackages.republished", "Package republished"))}
                              >
                                <RotateCcw className="w-4 h-4 me-2 text-green-600" />
                                {t("adminPackages.republish", "Republish")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleModeration(pkg, "archive", t("adminPackages.archived", "Package archived"))}
                              >
                                <Archive className="w-4 h-4 me-2" />
                                {t("adminPackages.archive", "Archive")}
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleFeatured(pkg)}>
                            <Star className="w-4 h-4 me-2" />
                            {pkg.featured ? t("adminPackages.removeFeatured") : t("adminPackages.makeFeatured")}
                          </DropdownMenuItem>
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
    </div>
  );
}
