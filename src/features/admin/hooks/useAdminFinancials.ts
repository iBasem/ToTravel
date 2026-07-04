import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { formatDate } from '@/lib/formatters';

interface Payout {
  id: string;
  agency_id: string;
  agency_name: string;
  period_start: string;
  period_end: string;
  amount: number;
  commission_rate: number;
  status: string;
  processed_at: string | null;
  created_at: string;
}

interface FinancialStats {
  totalRevenue: number;
  platformCommission: number;
  pendingPayouts: number;
  processedPayouts: number;
  pendingPayoutsCount: number;
}

interface RevenueData {
  name: string;
  revenue: number;
  commission: number;
}

export function useAdminFinancials() {
  const { profile, user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    platformCommission: 0,
    pendingPayouts: 0,
    processedPayouts: 0,
    pendingPayoutsCount: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchFinancials();
    }
  }, [isAdmin]);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all bookings for revenue calculation
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('package_bookings')
        .select('total_price, created_at, status');

      if (bookingsError) throw bookingsError;

      // Fetch payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('agency_payouts')
        .select('*')
        .order('created_at', { ascending: false });

      // Handle case where table might not exist yet
      const payoutsArray = payoutsError ? [] : (payoutsData || []);

      // Fetch agencies for payout names
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('travel_agencies')
        .select('id, company_name');

      if (agenciesError) throw agenciesError;

      // Create agency map
      const agencyMap = new Map<string, string>();
      agenciesData?.forEach(a => {
        agencyMap.set(a.id, a.company_name);
      });

      // Map payouts
      const mappedPayouts: Payout[] = payoutsArray.map((p: any) => ({
        id: p.id,
        agency_id: p.agency_id,
        agency_name: agencyMap.get(p.agency_id) || 'Unknown Agency',
        period_start: p.period_start,
        period_end: p.period_end,
        amount: Number(p.amount),
        commission_rate: Number(p.commission_rate),
        status: p.status,
        processed_at: p.processed_at,
        created_at: p.created_at,
      }));

      setPayouts(mappedPayouts);

      // Calculate financial stats
      const confirmedBookings = (bookingsData || []).filter(b => b.status === 'confirmed');
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
      const defaultCommissionRate = 0.12;
      const platformCommission = totalRevenue * defaultCommissionRate;

      const pendingPayoutsAmount = mappedPayouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
      const processedPayoutsAmount = mappedPayouts
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + p.amount, 0);
      const pendingPayoutsCount = mappedPayouts.filter(p => p.status === 'pending').length;

      setStats({
        totalRevenue,
        platformCommission,
        pendingPayouts: pendingPayoutsAmount,
        processedPayouts: processedPayoutsAmount,
        pendingPayoutsCount,
      });

      // Calculate revenue data by month
      const monthlyData = new Map<string, { revenue: number; commission: number }>();
      const months = Array.from({ length: 12 }, (_, m) =>
        formatDate(new Date(2026, m, 1), 'MMM')
      );
      
      // Initialize last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = months[date.getMonth()];
        monthlyData.set(monthKey, { revenue: 0, commission: 0 });
      }

      // Aggregate bookings by month
      bookingsData?.forEach(b => {
        const bookingDate = new Date(b.created_at);
        const monthKey = months[bookingDate.getMonth()];
        const existing = monthlyData.get(monthKey);
        if (existing) {
          const revenue = Number(b.total_price || 0);
          existing.revenue += revenue;
          existing.commission += revenue * defaultCommissionRate;
        }
      });

      const revenueChartData: RevenueData[] = Array.from(monthlyData.entries()).map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        commission: Math.round(data.commission),
      }));

      setRevenueData(revenueChartData);
    } catch (err) {
      console.error('Error fetching financials:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const processPayouts = async (payoutIds: string[]) => {
    try {
      const { error } = await supabase
        .from('agency_payouts')
        .update({ 
          status: 'processed', 
          processed_at: new Date().toISOString(),
          processed_by: user?.id 
        })
        .in('id', payoutIds);

      if (error) throw error;

      await fetchFinancials();
      return { success: true };
    } catch (err) {
      console.error('Error processing payouts:', err);
      return { success: false, error: err };
    }
  };

  return {
    payouts,
    stats,
    revenueData,
    loading,
    error,
    refetch: fetchFinancials,
    processPayouts,
  };
}
