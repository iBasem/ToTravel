import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import { PageHeader } from "@/ui/page-header";
import { StatsCard } from "@/ui/stats-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { useTranslation } from "react-i18next";
import {
  Users,
  Building2,
  BookOpen,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { displayName, initials } from "@/lib/utils";
import {
  useAdminDashboard,
  useResolvePendingAction,
  useRefreshPlatformStats,
} from "@/features/admin/hooks/useAdminDashboard";
import { formatCurrency, formatNumber, formatRelativeTime, formatDate } from "@/lib/formatters";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [monthsBack, setMonthsBack] = useState(6);

  const { data, isLoading, isError, refetch } = useAdminDashboard(monthsBack);
  const resolveAction = useResolvePendingAction();
  const refreshStats = useRefreshPlatformStats();

  const stats = data?.stats ?? {
    totalUsers: 0,
    totalAgencies: 0,
    totalBookings: 0,
    platformRevenue: 0,
    activePackages: 0,
    usersGrowth: 0,
    newAgenciesThisMonth: 0,
    bookingsGrowth: 0,
    revenueGrowth: 0,
  };
  const activityLogs = data?.activityLogs ?? [];
  const pendingActions = data?.pendingActions ?? [];
  const revenueData = data?.revenueData ?? [];
  const platformStats = data?.platformStats ?? [];

  const formatActionType = (type: string) => {
    return t(`admin.actionTypes.${type}`, {
      defaultValue: type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    });
  };

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return t("admin.priorityUrgent");
      case "high":
        return t("admin.priorityHigh");
      case "medium":
        return t("admin.priorityMedium");
      case "low":
        return t("admin.priorityLow");
      default:
        return priority;
    }
  };

  // Same visual vocabulary as the Pending Actions page (PendingActionsQueue).
  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="text-xs ms-auto">{priorityLabel(priority)}</Badge>;
      case "high":
        return <Badge className="text-xs ms-auto bg-deal text-deal-foreground border-transparent hover:bg-deal">{priorityLabel(priority)}</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs ms-auto">{priorityLabel(priority)}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs ms-auto">{priorityLabel(priority)}</Badge>;
    }
  };

  const activityTypeLabel = (type: string) => {
    switch (type) {
      case "booking":
        return t("admin.activityBooking");
      case "registration":
        return t("admin.activityRegistration");
      case "listing":
        return t("admin.activityListing");
      case "verification":
        return t("admin.activityVerification");
      default:
        return formatActionType(type);
    }
  };

  const handleResolveAction = (actionId: string, actionTitle: string) => {
    resolveAction.mutate(
      { actionId, actionTitle, status: "resolved" },
      {
        onSuccess: () => toast.success(t("admin.actionResolved", "Action resolved")),
        onError: () => toast.error(t("admin.actionResolveError", "Could not resolve action")),
      },
    );
  };

  const handleRefreshStats = () => {
    refreshStats.mutate(undefined, {
      onSuccess: () => toast.success(t("admin.statsRefreshed", "Today's platform stats recomputed")),
      onError: () => toast.error(t("admin.statsRefreshError", "Could not refresh platform stats")),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={t("admin.loadErrorTitle", "Could not load dashboard")}
        description={t("admin.loadErrorDescription", "Something went wrong while loading the dashboard. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  const growthFooter = (percent: number) => {
    const negative = percent < 0;
    const Icon = negative ? TrendingDown : TrendingUp;
    return (
      <div className={`flex items-center text-sm ${negative ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
        <Icon className="w-4 h-4 me-1" aria-hidden="true" />
        <span className="tabular-nums" dir="ltr">{negative ? "" : "+"}{percent}%</span>
        <span className="ms-1">{t("admin.fromLastMonth")}</span>
      </div>
    );
  };

  const metricCards = [
    {
      title: t("admin.totalUsers"),
      icon: Users,
      value: formatNumber(stats.totalUsers),
      footer: growthFooter(stats.usersGrowth),
    },
    {
      title: t("admin.travelAgencies"),
      icon: Building2,
      value: formatNumber(stats.totalAgencies),
      footer: (
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="tabular-nums me-1">+{formatNumber(stats.newAgenciesThisMonth)}</span>
          {t("admin.newAgenciesThisMonth")}
        </div>
      ),
    },
    {
      title: t("admin.totalBookings"),
      icon: BookOpen,
      value: formatNumber(stats.totalBookings),
      footer: growthFooter(stats.bookingsGrowth),
    },
    {
      title: t("admin.platformRevenue"),
      icon: DollarSign,
      value: formatCurrency(stats.platformRevenue),
      footer: growthFooter(stats.revenueGrowth),
    },
    {
      title: t("admin.activePackages", "Active packages"),
      icon: Package,
      value: formatNumber(stats.activePackages),
      footer: (
        <div className="text-sm text-muted-foreground">{t("admin.publishedNow", "published right now")}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.dashboard")}
        description={t("admin.overview")}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center">
              <RefreshCw className="w-4 h-4 me-2" />
              {t("common.refresh")}
            </Button>
            <Button onClick={handleRefreshStats} disabled={refreshStats.isPending}>
              <BarChart3 className="w-4 h-4 me-2" />
              {refreshStats.isPending ? t("admin.refreshingStats", "Recomputing…") : t("admin.refreshStats", "Refresh stats")}
            </Button>
          </>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {metricCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("admin.revenueBookingsTrend")}</CardTitle>
              <Select value={String(monthsBack)} onValueChange={(v) => setMonthsBack(Number(v))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{t("admin.last3Months", "Last 3 months")}</SelectItem>
                  <SelectItem value="6">{t("admin.last6Months")}</SelectItem>
                  <SelectItem value="12">{t("admin.last12Months", "Last 12 months")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80" dir="ltr">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation={isRTL ? "right" : "left"} />
                    <YAxis yAxisId="right" orientation={isRTL ? "left" : "right"} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} name={t("admin.revenueLabel")} />
                    <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="hsl(var(--chart-2))" strokeWidth={2} name={t("common.bookings")} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t("admin.noChartData", "No booking data for this range yet")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("admin.pendingActions")}</CardTitle>
              <Badge variant="destructive">{pendingActions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mb-2 text-green-500" />
                <p className="text-sm">{t("admin.allCaughtUp")}</p>
              </div>
            ) : (
              pendingActions.slice(0, 3).map((action) => (
                <div key={action.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div className="flex-1 min-w-0 text-start">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {formatActionType(action.action_type)}
                      </Badge>
                      {priorityBadge(action.priority)}
                    </div>
                    <h4 className="font-medium text-sm mt-1">{action.title}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(new Date(action.created_at))}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => handleResolveAction(action.id, action.title)}
                      >
                        {t("admin.resolve")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            <Button className="w-full" size="sm" variant="outline" asChild>
              <Link to="/admin/actions">
                {t("admin.viewAllActions")} ({pendingActions.length})
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Platform stats history (daily snapshots) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.platformStatsHistory", "Daily platform snapshots")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72" dir="ltr">
            {platformStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformStats.map((s) => ({ ...s, label: formatDate(s.stat_date, "MMM d") }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" orientation={isRTL ? "right" : "left"} />
                  <YAxis yAxisId="right" orientation={isRTL ? "left" : "right"} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_revenue" fill="hsl(var(--chart-1))" name={t("admin.revenueLabel")} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="total_bookings" fill="hsl(var(--chart-2))" name={t("common.bookings")} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="new_travelers" fill="hsl(var(--chart-3))" name={t("admin.newTravelers", "New travelers")} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t("admin.noStatsHistory", "No snapshots yet — use Refresh stats to record today's numbers")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("admin.recentActivity")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/activity">{t("common.viewAll")}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("admin.noRecentActivity")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(activity.user_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-start">
                    <p className="text-sm">
                      <span className="font-medium">{displayName(activity.user_name)}</span> {activity.action_description}
                    </p>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(new Date(activity.created_at))}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{activityTypeLabel(activity.action_type)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
