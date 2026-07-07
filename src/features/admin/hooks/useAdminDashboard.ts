import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { formatDate } from '@/lib/formatters';

interface AdminStats {
  totalUsers: number;
  totalAgencies: number;
  totalBookings: number;
  platformRevenue: number;
  usersGrowth: number;
  agenciesGrowth: number;
  bookingsGrowth: number;
  revenueGrowth: number;
}

interface ActivityLog {
  id: string;
  user_name: string;
  action_type: string;
  action_description: string;
  entity_type: string | null;
  created_at: string;
  avatar_url?: string | null;
}

interface PendingAction {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
}

interface RevenueData {
  name: string;
  bookings: number;
  revenue: number;
}

export function useAdminDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAgencies: 0,
    totalBookings: 0,
    platformRevenue: 0,
    usersGrowth: 0,
    agenciesGrowth: 0,
    bookingsGrowth: 0,
    revenueGrowth: 0,
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all counts in parallel
      const [
        travelersResult,
        agenciesResult,
        bookingsResult,
        activityResult,
        pendingResult
      ] = await Promise.all([
        supabase.from('travelers').select('id, created_at', { count: 'exact' }),
        supabase.from('travel_agencies').select('id, created_at', { count: 'exact' }),
        supabase.from('package_bookings').select('id, total_price, created_at', { count: 'exact' }),
        supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('admin_pending_actions').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      ]);

      // Calculate total revenue from bookings
      const allBookings = bookingsResult.data || [];
      const totalRevenue = allBookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);

      // Calculate real month-over-month growth
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const allTravelers = travelersResult.data || [];
      const allAgencies = agenciesResult.data || [];

      const currentMonthTravelers = allTravelers.filter(t => new Date(t.created_at) >= startOfCurrentMonth).length;
      const lastMonthTravelers = allTravelers.filter(t => new Date(t.created_at) >= startOfLastMonth && new Date(t.created_at) < startOfCurrentMonth).length;
      const currentMonthAgencies = allAgencies.filter(a => new Date(a.created_at) >= startOfCurrentMonth).length;
      const lastMonthAgencies = allAgencies.filter(a => new Date(a.created_at) >= startOfLastMonth && new Date(a.created_at) < startOfCurrentMonth).length;
      const currentMonthBookings = allBookings.filter(b => new Date(b.created_at) >= startOfCurrentMonth).length;
      const lastMonthBookings = allBookings.filter(b => new Date(b.created_at) >= startOfLastMonth && new Date(b.created_at) < startOfCurrentMonth).length;
      const currentMonthRevenue = allBookings.filter(b => new Date(b.created_at) >= startOfCurrentMonth).reduce((sum, b) => sum + Number(b.total_price || 0), 0);
      const lastMonthRevenue = allBookings.filter(b => new Date(b.created_at) >= startOfLastMonth && new Date(b.created_at) < startOfCurrentMonth).reduce((sum, b) => sum + Number(b.total_price || 0), 0);

      const calcGrowth = (current: number, previous: number) =>
        previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : current > 0 ? 100 : 0;

      setStats({
        totalUsers: (travelersResult.count || 0) + (agenciesResult.count || 0),
        totalAgencies: agenciesResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        platformRevenue: totalRevenue,
        usersGrowth: calcGrowth(currentMonthTravelers + currentMonthAgencies, lastMonthTravelers + lastMonthAgencies),
        agenciesGrowth: calcGrowth(currentMonthAgencies, lastMonthAgencies),
        bookingsGrowth: calcGrowth(currentMonthBookings, lastMonthBookings),
        revenueGrowth: calcGrowth(currentMonthRevenue, lastMonthRevenue),
      });

      if (activityResult.data) {
        // Attach the acting user's avatar where a traveler profile exists
        const actorIds = Array.from(
          new Set(activityResult.data.map((a: { user_id?: string | null }) => a.user_id).filter(Boolean))
        ) as string[];
        const avatarMap = new Map<string, string | null>();
        if (actorIds.length > 0) {
          const { data: actorRows } = await supabase
            .from('travelers')
            .select('id, avatar_url')
            .in('id', actorIds);
          actorRows?.forEach(r => avatarMap.set(r.id, r.avatar_url));
        }
        setActivityLogs(
          activityResult.data.map((a: ActivityLog & { user_id?: string | null }) => ({
            ...a,
            avatar_url: a.user_id ? avatarMap.get(a.user_id) ?? null : null,
          }))
        );
      }

      if (pendingResult.data) {
        setPendingActions(pendingResult.data as PendingAction[]);
      }

      // Build revenue chart from real booking data (last 6 months)
      const months = Array.from({ length: 12 }, (_, m) =>
        formatDate(new Date(2026, m, 1), 'MMM')
      );
      const monthlyMap = new Map<string, { bookings: number; revenue: number }>();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyMap.set(months[date.getMonth()], { bookings: 0, revenue: 0 });
      }

      allBookings.forEach(b => {
        const date = new Date(b.created_at);
        const monthKey = months[date.getMonth()];
        const existing = monthlyMap.get(monthKey);
        if (existing) {
          existing.bookings++;
          existing.revenue += Number(b.total_price || 0);
        }
      });

      const chartData: RevenueData[] = Array.from(monthlyMap.entries()).map(([name, data]) => ({
        name,
        bookings: data.bookings,
        revenue: Math.round(data.revenue),
      }));
      setRevenueData(chartData);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updatePendingAction = async (actionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('admin_pending_actions')
        .update({
          status,
          resolved_by: user?.id,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', actionId);

      if (error) throw error;

      // Refresh pending actions
      const { data } = await supabase
        .from('admin_pending_actions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingActions(data as PendingAction[]);
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating pending action:', err);
      return { success: false, error: err };
    }
  };

  return {
    stats,
    activityLogs,
    pendingActions,
    revenueData,
    loading,
    error,
    isAdmin,
    refetch: fetchDashboardData,
    updatePendingAction,
  };
}
