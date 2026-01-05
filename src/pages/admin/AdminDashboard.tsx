import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { formatDistanceToNow } from "date-fns";

const formatActionType = (type: string) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getActivityTypeColor = (type: string) => {
  switch (type) {
    case 'booking': return 'bg-blue-100 text-blue-800';
    case 'registration': return 'bg-green-100 text-green-800';
    case 'listing': return 'bg-purple-100 text-purple-800';
    case 'verification': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const { 
    stats, 
    activityLogs, 
    pendingActions, 
    revenueData, 
    loading, 
    refetch,
    updatePendingAction 
  } = useAdminDashboard();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleResolveAction = async (actionId: string) => {
    await updatePendingAction(actionId, 'resolved');
  };

  if (loading) {
    return (
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
          <p className="text-gray-600">{t('admin.overview')}</p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline" onClick={refetch} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.refresh')}
          </Button>
          <Button>{t('admin.quickActions')}</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium text-gray-500">{t('admin.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : ''}>
            <div className="text-2xl font-bold tabular-nums">{stats.totalUsers.toLocaleString()}</div>
            <div className={`flex items-center text-sm text-green-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <TrendingUp className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              +{stats.usersGrowth}% {t('admin.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium text-gray-500">{t('admin.travelAgencies')}</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : ''}>
            <div className="text-2xl font-bold tabular-nums">{stats.totalAgencies}</div>
            <div className={`flex items-center text-sm text-green-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <TrendingUp className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              +{stats.agenciesGrowth} {t('admin.newThisMonth')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium text-gray-500">{t('admin.totalBookings')}</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : ''}>
            <div className="text-2xl font-bold tabular-nums">{stats.totalBookings.toLocaleString()}</div>
            <div className={`flex items-center text-sm text-green-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <TrendingUp className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              +{stats.bookingsGrowth}% {t('admin.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium text-gray-500">{t('admin.platformRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className={isRTL ? 'text-right' : ''}>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.platformRevenue)}</div>
            <div className={`flex items-center text-sm text-green-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <TrendingUp className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              +{stats.revenueGrowth}% {t('admin.fromLastMonth')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
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
                    name="Revenue ($)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Bookings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle>{t('admin.pendingActions')}</CardTitle>
              <Badge variant="destructive">{pendingActions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mb-2 text-green-500" />
                <p className="text-sm">{t('admin.allCaughtUp')}</p>
              </div>
            ) : (
              pendingActions.slice(0, 3).map((action) => (
                <div key={action.id} className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <Badge variant="outline" className="text-xs">
                        {formatActionType(action.action_type)}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mt-1">{action.title}</h4>
                    <p className="text-xs text-gray-600">{action.description}</p>
                    <div className={`flex items-center justify-between mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
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
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle>{t('admin.recentActivity')}</CardTitle>
            <Button variant="ghost" size="sm">{t('common.viewAll')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t('admin.noRecentActivity')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((activity) => (
                <div key={activity.id} className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{activity.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span> {activity.action_description}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <Badge className={`text-xs ${getActivityTypeColor(activity.action_type)}`}>
                    {activity.action_type}
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
