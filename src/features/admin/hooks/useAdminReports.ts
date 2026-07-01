import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface ReportStats {
  growthRate: number;
  avgBookingValue: number;
  conversionRate: number;
  activePackages: number;
}

interface MonthlyData {
  name: string;
  bookings: number;
  revenue: number;
  users: number;
}

interface DestinationData {
  name: string;
  value: number;
  color: string;
}

export function useAdminReports() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ReportStats>({
    growthRate: 0,
    avgBookingValue: 0,
    conversionRate: 0,
    activePackages: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [destinationData, setDestinationData] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch platform stats
      const { data: platformStats, error: statsError } = await supabase
        .from('platform_stats')
        .select('*')
        .order('stat_date', { ascending: true })
        .limit(6);

      // Fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('package_bookings')
        .select('total_price, created_at');

      if (bookingsError) throw bookingsError;

      // Fetch active packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('id, destination, status');

      if (packagesError) throw packagesError;

      // Fetch travelers for this month and last month
      const { data: travelersData, error: travelersError } = await supabase
        .from('travelers')
        .select('created_at');

      if (travelersError) throw travelersError;

      // Calculate stats
      const confirmedBookings = bookingsData || [];
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
      const avgBookingValue = confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0;
      
      const activePackages = (packagesData || []).filter(p => p.status === 'published').length;
      const totalPackages = packagesData?.length || 1;

      // Calculate growth (compare current month to previous)
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const currentMonthBookings = confirmedBookings.filter(b => 
        new Date(b.created_at) >= startOfCurrentMonth
      ).length;
      const lastMonthBookings = confirmedBookings.filter(b => 
        new Date(b.created_at) >= startOfLastMonth && 
        new Date(b.created_at) < startOfCurrentMonth
      ).length;

      const growthRate = lastMonthBookings > 0 
        ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 
        : currentMonthBookings > 0 ? 100 : 0;

      // Estimate conversion rate (travelers to bookings ratio)
      const totalTravelers = travelersData?.length || 1;
      const conversionRate = (confirmedBookings.length / totalTravelers) * 100;

      setStats({
        growthRate: Math.round(growthRate * 10) / 10,
        avgBookingValue: Math.round(avgBookingValue),
        conversionRate: Math.round(conversionRate * 10) / 10,
        activePackages,
      });

      // Process monthly data from platform_stats or calculate from bookings
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (platformStats && platformStats.length > 0) {
        const monthly: MonthlyData[] = platformStats.map((s: any) => {
          const date = new Date(s.stat_date);
          return {
            name: months[date.getMonth()],
            bookings: s.total_bookings,
            revenue: Number(s.total_revenue),
            users: s.new_travelers,
          };
        });
        setMonthlyData(monthly);
      } else {
        // Fallback: calculate from actual bookings
        const monthlyMap = new Map<string, { bookings: number; revenue: number; users: number }>();
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = months[date.getMonth()];
          monthlyMap.set(monthKey, { bookings: 0, revenue: 0, users: 0 });
        }

        bookingsData?.forEach(b => {
          const date = new Date(b.created_at);
          const monthKey = months[date.getMonth()];
          const existing = monthlyMap.get(monthKey);
          if (existing) {
            existing.bookings++;
            existing.revenue += Number(b.total_price || 0);
          }
        });

        travelersData?.forEach(t => {
          const date = new Date(t.created_at);
          const monthKey = months[date.getMonth()];
          const existing = monthlyMap.get(monthKey);
          if (existing) {
            existing.users++;
          }
        });

        const monthly: MonthlyData[] = Array.from(monthlyMap.entries()).map(([name, data]) => ({
          name,
          bookings: data.bookings,
          revenue: Math.round(data.revenue),
          users: data.users,
        }));
        setMonthlyData(monthly);
      }

      // Calculate destination distribution
      const destinationCounts = new Map<string, number>();
      packagesData?.forEach(p => {
        // Extract region from destination
        const destination = p.destination?.toLowerCase() || 'other';
        let region = 'Others';
        
        if (destination.includes('japan') || destination.includes('china') || 
            destination.includes('korea') || destination.includes('thailand') ||
            destination.includes('vietnam') || destination.includes('indonesia') ||
            destination.includes('asia') || destination.includes('bali') ||
            destination.includes('tokyo') || destination.includes('bangkok')) {
          region = 'Asia';
        } else if (destination.includes('france') || destination.includes('italy') ||
                   destination.includes('spain') || destination.includes('germany') ||
                   destination.includes('uk') || destination.includes('europe') ||
                   destination.includes('paris') || destination.includes('rome')) {
          region = 'Europe';
        } else if (destination.includes('usa') || destination.includes('canada') ||
                   destination.includes('mexico') || destination.includes('brazil') ||
                   destination.includes('america') || destination.includes('caribbean')) {
          region = 'Americas';
        }
        
        destinationCounts.set(region, (destinationCounts.get(region) || 0) + 1);
      });

      const totalDestinations = packagesData?.length || 1;
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      const destinations: DestinationData[] = [
        { name: 'Asia', value: 0, color: colors[0] },
        { name: 'Europe', value: 0, color: colors[1] },
        { name: 'Americas', value: 0, color: colors[2] },
        { name: 'Others', value: 0, color: colors[3] },
      ].map(d => ({
        ...d,
        value: Math.round(((destinationCounts.get(d.name) || 0) / totalDestinations) * 100) || 
               (d.name === 'Others' ? 100 : 0),
      }));

      // Ensure at least one has value if no packages
      if (destinations.every(d => d.value === 0)) {
        destinations[0].value = 25;
        destinations[1].value = 25;
        destinations[2].value = 25;
        destinations[3].value = 25;
      }

      setDestinationData(destinations);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    monthlyData,
    destinationData,
    loading,
    error,
    refetch: fetchReports,
  };
}
