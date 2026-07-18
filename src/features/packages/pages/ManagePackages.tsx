import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Filter, ChevronLeft } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { PageHeader } from "@/ui/page-header";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyAudit } from "@/features/agency/lib/audit";
import { usePackages, type PackageWithDetails } from "@/features/packages/hooks/usePackages";
import { PackageListItem } from "@/features/packages/components/manage/PackageListItem";
import { PackageDetailPane } from "@/features/packages/components/manage/PackageDetailPane";
import { TripSchedule } from "@/features/packages/components/manage/TripSchedule";

type StatusFilter = "all" | "published" | "pending" | "draft" | "archived" | "suspended";

export default function Packages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { packages, loading, error, deletePackage, updatePackage, refetch } = usePackages();
  const audit = useAgencyAudit();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // On desktop both panes show at once (selectedId drives the split view). On
  // mobile the list comes first; tapping a row opens the detail overlay.
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);

  const filtered = useMemo(
    () =>
      packages.filter(
        (pkg) =>
          (statusFilter === "all" || pkg.status === statusFilter) &&
          (pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.destination.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    [packages, statusFilter, searchTerm],
  );

  // Keep a valid selection: default to the first row, and fall back if the
  // selected package is filtered out of view.
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
    } else if (!selectedId || !filtered.some((p) => p.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((p) => p.id === selectedId) ?? null;

  const handleCreate = () => navigate("/travel_agency/packages/create");

  // One handler, per-status semantics (audit AGY-29):
  //   draft     -> pending  (submit for review, departures-gated)
  //   pending   -> draft    (withdraw the submission)
  //   published -> draft    (unpublish)
  //   suspended -> pending  (resubmit for admin review, confirmed first)
  const handleTogglePublish = async (pkg: PackageWithDetails) => {
    try {
      if (pkg.status === "archived") return;
      if (pkg.status === "suspended" &&
        !confirm(t("agencyDashboard.resubmitSuspendedConfirm", "Resubmit this suspended package for admin review?"))) {
        return;
      }
      const newStatus = pkg.status === "draft" || pkg.status === "suspended" ? "pending" : "draft";
      // Submitting for review requires >=1 upcoming departure (same gate as
      // save_package and the DB trigger, which since wave4 also covers
      // suspended resubmits); check first for a friendly path.
      if (newStatus === "pending") {
        const { count, error: depError } = await supabase
          .from("package_departures")
          .select("id", { count: "exact", head: true })
          .eq("package_id", pkg.id)
          .eq("status", "scheduled")
          .gte("departure_date", new Date().toISOString().slice(0, 10));
        if (depError) throw depError;
        if (!count) {
          toast.error(
            t(
              "agencyDashboard.departureRequiredBeforeSubmit",
              "Add at least one upcoming departure before submitting for review",
            ),
          );
          navigate(`/travel_agency/packages/${pkg.id}/departures`);
          return;
        }
      }
      await updatePackage(pkg.id, { status: newStatus });
      void audit({
        actionType: `package_${newStatus === "pending" ? "submitted" : pkg.status === "pending" ? "withdrawn" : "unpublished"}`,
        description: `Package "${pkg.title}" ${pkg.status} -> ${newStatus}`,
        entityType: "package",
        entityId: pkg.id,
      });
      toast.success(
        newStatus === "pending"
          ? t("agencyDashboard.submittedForReview", "Submitted for review")
          : pkg.status === "pending"
            ? t("agencyDashboard.withdrawnToDraft", "Submission withdrawn to draft")
            : t("agencyDashboard.unpublished", "Unpublished"),
      );
    } catch (err) {
      // Surface the guard's own message (e.g. the departures gate) instead of
      // the misleading "error loading packages" copy (REG-15).
      const message = err instanceof Error && err.message ? err.message : null;
      toast.error(message ?? t("agencyDashboard.statusChangeFailed", "Couldn't change the package status"));
    }
  };

  const handleDelete = async (pkg: PackageWithDetails) => {
    if (!confirm(`${t("common.deletePackageConfirm", "Are you sure you want to delete")} "${pkg.title}"?`)) return;
    try {
      await deletePackage(pkg.id);
      void audit({
        actionType: "package_deleted",
        description: `Package "${pkg.title}" deleted`,
        entityType: "package",
        entityId: pkg.id,
      });
      toast.success(t("packageWizard.packageDeleted", "Package deleted successfully"));
    } catch (err) {
      // FK RESTRICT from data3_protect_financial_history: booking history
      // blocks hard deletes — explain instead of a generic failure (AGY-20).
      if ((err as { code?: string })?.code === "23503") {
        toast.error(t("agencyDashboard.deleteHasBookings",
          "This package has bookings, so it can't be deleted. Unpublish it, or ask an admin to archive it."));
      } else {
        toast.error(t("errors.somethingWentWrong", "Error deleting package"));
      }
    }
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("agencyDashboard.allStatuses", "All statuses") },
    { value: "published", label: t("agencyDashboard.published") },
    { value: "pending", label: t("agencyDashboard.pendingReview", "Pending review") },
    { value: "draft", label: t("agencyDashboard.draft") },
    { value: "suspended", label: t("agencyDashboard.suspended", "Suspended") },
    { value: "archived", label: t("agencyDashboard.archived", "Archived") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={t("agencyDashboard.errorLoadingPackages")}
        description={error}
        action={{ label: t("common.retry"), onClick: () => void refetch() }}
      />
    );
  }

  // Brand-new agency, no packages at all.
  if (packages.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("agencyDashboard.travelPackages")} description={t("agencyDashboard.managePackages")} />
        <EmptyState
          icon="package"
          title={t("agencyDashboard.noPackagesYet")}
          description={t("agencyDashboard.createFirstPackageDesc")}
          action={{ label: t("agencyDashboard.createPackage"), onClick: handleCreate }}
        />
      </div>
    );
  }

  const detailActions = (pkg: PackageWithDetails) => ({
    onEdit: () => navigate(`/travel_agency/packages/${pkg.id}/edit`),
    onManageDepartures: () => navigate(`/travel_agency/packages/${pkg.id}/departures`),
    onDuplicate: () => navigate(`/travel_agency/packages/create?duplicate=${pkg.id}`),
    onTogglePublish: () => handleTogglePublish(pkg),
    onPreview: () => navigate(`/travel_agency/packages/${pkg.id}`),
    onDelete: () => handleDelete(pkg),
  });

  const listPane = (
    <div className="flex flex-col h-full min-h-0 p-3">
      <div className="space-y-2.5 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("agencyDashboard.searchPackagesLocation", "Search package, location…")}
            className="ps-9 h-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm">
              <Filter className="h-4 w-4" />
              {statusFilter === "all"
                ? t("agencyDashboard.allStatuses", "All statuses")
                : statusOptions.find((o) => o.value === statusFilter)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {statusOptions.map((o) => (
              <DropdownMenuItem
                key={o.value}
                onClick={() => setStatusFilter(o.value)}
                className={statusFilter === o.value ? "bg-primary/10 text-primary font-medium" : ""}
              >
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pe-1 -me-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("agencyDashboard.noPackagesFound")}
          </p>
        ) : (
          filtered.map((pkg) => (
            <PackageListItem key={pkg.id} pkg={pkg} selected={pkg.id === selectedId} onSelect={handleSelect} />
          ))
        )}
      </div>

      <div className="pt-3 mt-auto border-t border-border">
        <Button onClick={handleCreate} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          {t("agencyDashboard.addPackage", "Add Package")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title={t("agencyDashboard.travelPackages")} description={t("agencyDashboard.managePackages")} />

      {/* One contained panel. Desktop: three independent-scroll columns (recessed
          list · card detail · recessed schedule). Mobile: list, then detail. */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden lg:flex lg:h-[calc(100vh-13rem)]">
        {/* Left list — recessed neutral layer */}
        <aside className={`lg:w-80 lg:shrink-0 lg:h-full lg:border-e border-border bg-muted/30 ${mobileDetailOpen ? "hidden lg:flex" : "flex"} flex-col min-h-0`}>
          {listPane}
        </aside>

        {/* Detail + schedule */}
        {selected ? (
          <section className={`${mobileDetailOpen ? "flex" : "hidden lg:flex"} flex-col lg:flex-row lg:flex-1 lg:min-w-0 lg:h-full min-h-0`}>
            {/* Mobile back to list */}
            <button
              type="button"
              onClick={() => setMobileDetailOpen(false)}
              className="lg:hidden flex items-center gap-1 text-sm text-muted-foreground px-4 pt-4 self-start"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {t("agencyDashboard.backToList", "Back to packages")}
            </button>

            <div
              key={selected.id}
              className="lg:flex-1 lg:min-w-0 lg:h-full lg:overflow-y-auto p-4 sm:p-6 animate-in fade-in-0 duration-200 motion-reduce:animate-none"
            >
              <PackageDetailPane pkg={selected} isRTL={isRTL} {...detailActions(selected)} />
            </div>

            <div className="lg:w-80 xl:w-[22rem] lg:shrink-0 lg:h-full lg:overflow-y-auto lg:border-s border-border bg-muted/20 p-5">
              <h3 className="text-base font-semibold mb-4 text-start">{t("agencyDashboard.tripSchedule", "Trip Schedule")}</h3>
              <TripSchedule key={selected.id} itineraries={selected.itineraries ?? []} />
            </div>
          </section>
        ) : (
          <section className="hidden lg:flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t("agencyDashboard.selectPackage", "Select a package")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
