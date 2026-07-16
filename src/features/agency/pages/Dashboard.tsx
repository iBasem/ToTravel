import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { Button } from "@/ui/button";
import { useAgencyOverview } from "@/features/agency/hooks/useAgencyOverview";
import { OverviewKpis } from "@/features/agency/components/overview/OverviewKpis";
import { RevenueOverviewCard } from "@/features/agency/components/overview/RevenueOverviewCard";
import { TopDestinationsCard } from "@/features/agency/components/overview/TopDestinationsCard";
import { TripsProgressCard } from "@/features/agency/components/overview/TripsProgressCard";
import { PackagesShowcaseCard } from "@/features/agency/components/overview/PackagesShowcaseCard";
import { RecentBookingsCard } from "@/features/agency/components/overview/RecentBookingsCard";
import { MiniCalendarCard } from "@/features/agency/components/overview/MiniCalendarCard";
import { UpcomingTripsCard } from "@/features/agency/components/overview/UpcomingTripsCard";
import { MessagesCard } from "@/features/agency/components/overview/MessagesCard";
import { ActivityFeedCard } from "@/features/agency/components/overview/ActivityFeedCard";

export default function Dashboard() {
  const { data, loading, error, refetch } = useAgencyOverview();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={t("agencyDashboard.errorLoadingDashboard")}
        description={error ?? undefined}
        action={{ label: t("common.retry"), onClick: () => refetch() }}
      />
    );
  }

  // Brand-new agency: no packages and no bookings — keep the onboarding CTA.
  if (!data.hasAnyData) {
    return (
      <div className="space-y-6">
        <div className="text-start">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("agencyDashboard.title")}</h1>
        </div>
        <EmptyState
          icon="package"
          title={t("agencyDashboard.welcomeToDashboard")}
          description={t("agencyDashboard.startByCreating")}
          action={{
            label: t("agencyDashboard.createPackage"),
            onClick: () => navigate("/travel_agency/packages/create"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-start">{t("agencyDashboard.title")}</h1>
        <Button onClick={() => navigate("/travel_agency/packages/create")} className="shrink-0">
          {t("agencyDashboard.createPackage")}
        </Button>
      </div>

      <OverviewKpis
        bookings={data.kpis.bookings}
        newCustomers={data.kpis.newCustomers}
        earnings={data.kpis.earnings}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueOverviewCard weekly={data.revenueWeekly} monthly={data.revenueMonthly} />
            <TopDestinationsCard bookings={data.bookings} />
          </div>
          <TripsProgressCard trips={data.trips} />
          <PackagesShowcaseCard packages={data.packages} />
          <RecentBookingsCard bookings={data.bookings} />
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <MiniCalendarCard bookings={data.bookings} />
          <UpcomingTripsCard trips={data.upcomingTrips} />
          <MessagesCard />
          <ActivityFeedCard activity={data.activity} />
        </div>
      </div>
    </div>
  );
}
