
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface DashboardStats {
  totalPackages: number;
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPackages: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useTranslation();

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch total packages for this agency
      const { count: packagesCount, error: packagesError } = await supabase
        .from('packages')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', user.id);

      if (packagesError) throw packagesError;

      // Fetch total bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('package_bookings')
        .select(`
          traveler_id,
          total_price,
          status,
          packages!inner(agency_id)
        `)
        .eq('packages.agency_id', user.id);

      if (bookingsError) throw bookingsError;

      const totalBookings = bookingsData?.length || 0;
      // Cancelled bookings never earn revenue
      const totalRevenue = bookingsData
        ?.filter((booking) => booking.status !== 'cancelled')
        .reduce((sum, booking) => sum + Number(booking.total_price), 0) || 0;

      // Get unique travelers count
      const uniqueTravelers = bookingsData 
        ? [...new Set(bookingsData.map((booking) => booking.traveler_id))].length
        : 0;

      setStats({
        totalPackages: packagesCount || 0,
        totalBookings,
        totalRevenue,
        totalCustomers: uniqueTravelers
      });
    } catch (err) {
      console.error('Exception fetching dashboard stats:', err);
      setError(t('toasts.statsLoadFailed', 'Failed to load dashboard stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Key on the id, not the object (auth events re-create the user object).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
