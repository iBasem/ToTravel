import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/formatters';

export interface ReportStats {
  growthRate: number;
  avgBookingValue: number;
  conversionRate: number;
  activePackages: number;
}

export interface MonthlyData {
  name: string;
  bookings: number;
  revenue: number;
  users: number;
}

export interface DestinationData {
  name: string;
  value: number;
  color: string;
}

export const adminReportsKey = ['admin', 'reports'] as const;

export function useAdminReports(monthsBack: number = 6) {
  return useQuery({
    queryKey: [...adminReportsKey, monthsBack],
    queryFn: async (): Promise<{ stats: ReportStats; monthlyData: MonthlyData[]; destinationData: DestinationData[] }> => {
      const [bookingsRes, packagesRes, travelersRes, regionRes] = await Promise.all([
        supabase.from('package_bookings').select('traveler_id, total_price, created_at'),
        supabase.from('packages').select('id, destination, status'),
        supabase.from('travelers').select('created_at'),
        supabase.from('package_region_stats').select('*'),
      ]);
      for (const res of [bookingsRes, packagesRes, travelersRes, regionRes]) {
        if (res.error) throw res.error;
      }

      const bookings = bookingsRes.data ?? [];
      const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price ?? 0), 0);
      const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
      const activePackages = (packagesRes.data ?? []).filter((p) => p.status === 'published').length;

      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthBookings = bookings.filter((b) => new Date(b.created_at) >= startOfCurrentMonth).length;
      const lastMonthBookings = bookings.filter(
        (b) => new Date(b.created_at) >= startOfLastMonth && new Date(b.created_at) < startOfCurrentMonth,
      ).length;
      const growthRate =
        lastMonthBookings > 0
          ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
          : currentMonthBookings > 0
            ? 100
            : 0;

      // Conversion = share of travelers who made at least one booking (repeat
      // bookings must not push this past 100%).
      const totalTravelers = travelersRes.data?.length || 1;
      const travelersWhoBooked = new Set(bookings.map((b) => b.traveler_id)).size;
      const conversionRate = (travelersWhoBooked / totalTravelers) * 100;

      // Monthly series over the selected range from real bookings + signups.
      const months = Array.from({ length: 12 }, (_, m) => formatDate(new Date(2026, m, 1), 'MMM'));
      const monthlyMap = new Map<string, { bookings: number; revenue: number; users: number }>();
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyMap.set(months[date.getMonth()], { bookings: 0, revenue: 0, users: 0 });
      }
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
      for (const b of bookings) {
        const date = new Date(b.created_at);
        if (date < rangeStart) continue;
        const existing = monthlyMap.get(months[date.getMonth()]);
        if (existing) {
          existing.bookings++;
          existing.revenue += Number(b.total_price ?? 0);
        }
      }
      for (const tr of travelersRes.data ?? []) {
        const date = new Date(tr.created_at);
        if (date < rangeStart) continue;
        const existing = monthlyMap.get(months[date.getMonth()]);
        if (existing) existing.users++;
      }

      // Destination distribution from the package_region_stats view.
      const regionCounts = new Map<string, number>();
      for (const r of regionRes.data ?? []) {
        const bucket =
          r.region_key === 'asia' ? 'Asia' : r.region_key === 'europe' ? 'Europe' : r.region_key === 'americas' ? 'Americas' : 'Others';
        regionCounts.set(bucket, (regionCounts.get(bucket) ?? 0) + (r.package_count ?? 0));
      }
      const totalDestinations = Array.from(regionCounts.values()).reduce((a, b) => a + b, 0) || 1;
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

      return {
        stats: {
          growthRate: Math.round(growthRate * 10) / 10,
          avgBookingValue: Math.round(avgBookingValue),
          conversionRate: Math.round(conversionRate * 10) / 10,
          activePackages,
        },
        monthlyData: Array.from(monthlyMap.entries()).map(([name, d]) => ({
          name,
          bookings: d.bookings,
          revenue: Math.round(d.revenue),
          users: d.users,
        })),
        destinationData: [
          { name: 'Asia', value: 0, color: colors[0] },
          { name: 'Europe', value: 0, color: colors[1] },
          { name: 'Americas', value: 0, color: colors[2] },
          { name: 'Others', value: 0, color: colors[3] },
        ].map((d) => ({
          ...d,
          value: Math.round(((regionCounts.get(d.name) ?? 0) / totalDestinations) * 100),
        })),
      };
    },
  });
}
