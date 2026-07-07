import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Skeleton } from "@/ui/skeleton";
import { useTranslation } from "react-i18next";
import {
  Users,
  Building2,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/formatters";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const formatActionType = (type: string) => {
    return t(`admin.actionTypes.${type}`, {
      defaultValue: type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('admin.priorityUrgent');
      case 'high': return t('admin.priorityHigh');
      case 'medium': return t('admin.priorityMedium');
      case 'low': return t('admin.priorityLow');
      default: return priority;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'booking': return t('admin.activityBooking');
      case 'registration': return t('admin.activityRegistration');
      case 'listing': return t('admin.activityListing');
      case 'verification': return t('admin.activityVerification');
      default: return type;
    }
  };

  const {
    stats,
    activityLogs,
    pendingActions,
    revenueData,
    loading,
    refetch,
    updatePendingAction
  } = useAdminDashboard();

  const handleResolveAction = async (actionId: string) => {
    await updatePendingAction(actionId, 'resolved');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="text-start">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground">{t('admin.overview')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refetch} className="flex items-center">
            <RefreshCw className="w-4 h-4 me-2" />
            {t('common.refresh')}
          </Button>
          <Button>{t('admin.quickActions')}</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatNumber(stats.totalUsers)}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 me-1" />
              +{stats.usersGrowth}% {t('admin.fromLastMonth')}
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.travelAgencies')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.totalAgencies}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 me-1" />
              +{stats.agenciesGrowth} {t('admin.newAgenciesThisMonth')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalBookings')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatNumber(stats.totalBookings)}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 me-1" />
              +{stats.bookingsGrowth}% {t('admin.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.platformRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.platformRevenue)}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 me-1" />
              +{stats.revenueGrowth}% {t('admin.fromLastMonth')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('admin.revenueBookingsTrend')}</CardTitle>
              <Button variant="outline" size="sm">{t('admin.last6Months')}</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation={isRTL ? "right" : "left"} />
                  <YAxis yAxisId="right" orientation={isRTL ? "left" : "right"} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name={t('admin.revenueLabel')}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="bookings"
                    stroke="#10B981"
                    strokeWidth={2}
                    name={t('common.bookings')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('admin.pendingActions')}</CardTitle>
              <Badge variant="destructive">{pendingActions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mb-2 text-green-500" />
                <p className="text-sm">{t('admin.allCaughtUp')}</p>
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
                      <Badge className="text-xs ms-auto">
                        {getPriorityColor(action.priority)}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mt-1">{action.title}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(action.created_at))}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => handleResolveAction(action.id)}
                      >
                        {t('admin.resolve')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {pendingActions.length > 3 && (
              <Button className="w-full" size="sm" variant="outline">
                {t('admin.viewAllActions')} ({pendingActions.length})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('admin.recentActivity')}</CardTitle>
            <Button variant="ghost" size="sm">{t('common.viewAll')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('admin.noRecentActivity')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.avatar_url ?? "/placeholder.svg"} />
                    <AvatarFallback>{activity.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-start">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span> {activity.action_description}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(activity.created_at))}
                    </span>
                  </div>
                  <Badge className="text-xs">
                    {getActivityTypeColor(activity.action_type)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
