import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { formatDate } from '@/lib/formatters';
import { useAdminAudit } from '../lib/audit';

export interface AdminStats {
  totalUsers: number;
  totalAgencies: number;
  totalBookings: number;
  /** Sum of bookings with payment_status = 'paid' — matches platform_stats. */
  platformRevenue: number;
  activePackages: number;
  usersGrowth: number;
  newAgenciesThisMonth: number;
  bookingsGrowth: number;
  revenueGrowth: number;
}

export interface ActivityLogRow {
  id: string;
  user_name: string;
  action_type: string;
  action_description: string;
  entity_type: string | null;
  created_at: string;
  avatar_url?: string | null;
}

export interface PendingAction {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
}

export interface RevenueData {
  name: string;
  bookings: number;
  revenue: number;
}

export interface PlatformStatRow {
  stat_date: string;
  total_bookings: number;
  total_revenue: number;
  new_travelers: number;
  new_agencies: number;
  active_packages: number;
}

interface DashboardBundle {
  stats: AdminStats;
  activityLogs: ActivityLogRow[];
  pendingActions: PendingAction[];
  revenueData: RevenueData[];
  platformStats: PlatformStatRow[];
}

export const adminDashboardKey = ['admin', 'dashboard'] as const;

export function useAdminDashboard(monthsBack: number = 6) {
  return useQuery({
    queryKey: [...adminDashboardKey, monthsBack],
    queryFn: async (): Promise<DashboardBundle> => {
      const [travelersResult, agenciesResult, bookingsResult, packagesResult, activityResult, pendingResult, statsResult] =
        await Promise.all([
          supabase.from('travelers').select('id, created_at', { count: 'exact' }),
          supabase.from('travel_agencies').select('id, created_at', { count: 'exact' }),
          supabase.from('package_bookings').select('id, total_price, payment_status, created_at', { count: 'exact' }),
          supabase.from('packages').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('admin_pending_actions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
          supabase.from('platform_stats').select('*').order('stat_date', { ascending: true }),
        ]);
      for (const res of [travelersResult, agenciesResult, bookingsResult, activityResult, pendingResult, statsResult]) {
        if (res.error) throw res.error;
      }

      const allBookings = bookingsResult.data ?? [];
      // Revenue counts only money actually collected, consistent with
      // platform_stats and the Financials page.
      const paidBookings = allBookings.filter((b) => b.payment_status === 'paid');
      const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.total_price ?? 0), 0);

      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const allTravelers = travelersResult.data ?? [];
      const allAgencies = agenciesResult.data ?? [];

      const inCurrent = (d: string) => new Date(d) >= startOfCurrentMonth;
      const inLast = (d: string) => new Date(d) >= startOfLastMonth && new Date(d) < startOfCurrentMonth;

      const calcGrowth = (current: number, previous: number) =>
        previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : current > 0 ? 100 : 0;

      const currentMonthRevenue = paidBookings.filter((b) => inCurrent(b.created_at)).reduce((s, b) => s + Number(b.total_price ?? 0), 0);
      const lastMonthRevenue = paidBookings.filter((b) => inLast(b.created_at)).reduce((s, b) => s + Number(b.total_price ?? 0), 0);

      const stats: AdminStats = {
        totalUsers: (travelersResult.count ?? 0) + (agenciesResult.count ?? 0),
        totalAgencies: agenciesResult.count ?? 0,
        totalBookings: bookingsResult.count ?? 0,
        platformRevenue: totalRevenue,
        activePackages: packagesResult.count ?? 0,
        usersGrowth: calcGrowth(
          allTravelers.filter((t) => inCurrent(t.created_at)).length + allAgencies.filter((a) => inCurrent(a.created_at)).length,
          allTravelers.filter((t) => inLast(t.created_at)).length + allAgencies.filter((a) => inLast(a.created_at)).length,
        ),
        newAgenciesThisMonth: allAgencies.filter((a) => inCurrent(a.created_at)).length,
        bookingsGrowth: calcGrowth(
          allBookings.filter((b) => inCurrent(b.created_at)).length,
          allBookings.filter((b) => inLast(b.created_at)).length,
        ),
        revenueGrowth: calcGrowth(currentMonthRevenue, lastMonthRevenue),
      };

      // Attach acting user's avatar where a traveler profile exists.
      let activityLogs: ActivityLogRow[] = (activityResult.data ?? []) as ActivityLogRow[];
      const actorIds = Array.from(
        new Set((activityResult.data ?? []).map((a: { user_id?: string | null }) => a.user_id).filter(Boolean)),
      ) as string[];
      if (actorIds.length > 0) {
        const { data: actorRows } = await supabase.from('travelers').select('id, avatar_url').in('id', actorIds);
        const avatarMap = new Map<string, string | null>();
        actorRows?.forEach((r) => avatarMap.set(r.id, r.avatar_url));
        activityLogs = (activityResult.data ?? []).map((a: ActivityLogRow & { user_id?: string | null }) => ({
          ...a,
          avatar_url: a.user_id ? avatarMap.get(a.user_id) ?? null : null,
        }));
      }

      // Revenue chart over the selected range from real bookings.
      const months = Array.from({ length: 12 }, (_, m) => formatDate(new Date(2026, m, 1), 'MMM'));
      const monthlyMap = new Map<string, { bookings: number; revenue: number }>();
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyMap.set(months[date.getMonth()], { bookings: 0, revenue: 0 });
      }
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
      for (const b of allBookings) {
        const date = new Date(b.created_at);
        if (date < rangeStart) continue;
        const existing = monthlyMap.get(months[date.getMonth()]);
        if (existing) {
          existing.bookings++;
          if (b.payment_status === 'paid') existing.revenue += Number(b.total_price ?? 0);
        }
      }

      return {
        stats,
        activityLogs,
        pendingActions: (pendingResult.data ?? []) as PendingAction[],
        revenueData: Array.from(monthlyMap.entries()).map(([name, d]) => ({
          name,
          bookings: d.bookings,
          revenue: Math.round(d.revenue),
        })),
        platformStats: ((statsResult.data ?? []) as PlatformStatRow[]).map((s) => ({
          ...s,
          total_revenue: Number(s.total_revenue),
        })),
      };
    },
  });
}

interface ResolvePendingInput {
  actionId: string;
  actionTitle: string;
  status: 'resolved' | 'dismissed';
}

export function useResolvePendingAction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ actionId, status }: ResolvePendingInput) => {
      const { error } = await supabase
        .from('admin_pending_actions')
        .update({ status, resolved_by: user?.id, resolved_at: new Date().toISOString() })
        .eq('id', actionId);
      if (error) throw error;
    },
    onSuccess: (_data, { actionId, actionTitle, status }) => {
      queryClient.invalidateQueries({ queryKey: adminDashboardKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-actions'] });
      void audit({
        actionType: status === 'resolved' ? 'pending_action_resolve' : 'pending_action_dismiss',
        description: `${status === 'resolved' ? 'Resolved' : 'Dismissed'} pending action "${actionTitle}"`,
        entityType: 'admin_pending_action',
        entityId: actionId,
        metadata: { status },
      });
    },
  });
}

/** Refreshes today's platform_stats snapshot via the admin-gated RPC. */
export function useRefreshPlatformStats() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('compute_platform_stats');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDashboardKey });
      void audit({
        actionType: 'stats_refresh',
        description: `Recomputed today's platform statistics snapshot`,
        entityType: 'platform_stats',
        entityId: null,
        metadata: {},
      });
    },
  });
}
