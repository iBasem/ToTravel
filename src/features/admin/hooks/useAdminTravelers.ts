import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface Traveler {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  bookings_count: number;
}

interface TravelerStats {
  total: number;
  active: number;
  suspended: number;
  newThisMonth: number;
}

export function useAdminTravelers() {
  const { profile } = useAuth();
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [stats, setStats] = useState<TravelerStats>({
    total: 0,
    active: 0,
    suspended: 0,
    newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchTravelers();
    }
  }, [isAdmin]);

  const fetchTravelers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch travelers
      const { data: travelersData, error: travelersError } = await supabase
        .from('travelers')
        .select('*')
        .order('created_at', { ascending: false });

      if (travelersError) throw travelersError;

      // Fetch booking counts for each traveler
      const { data: bookingCounts, error: bookingError } = await supabase
        .from('package_bookings')
        .select('traveler_id');

      if (bookingError) throw bookingError;

      // Count bookings per traveler
      const bookingsMap = new Map<string, number>();
      bookingCounts?.forEach(b => {
        bookingsMap.set(b.traveler_id, (bookingsMap.get(b.traveler_id) || 0) + 1);
      });

      // Map travelers with booking counts
      const mappedTravelers: Traveler[] = (travelersData || []).map(t => ({
        id: t.id,
        first_name: t.first_name,
        last_name: t.last_name,
        email: t.email,
        phone: t.phone,
        avatar_url: t.avatar_url,
        status: t.status || 'active',
        created_at: t.created_at,
        bookings_count: bookingsMap.get(t.id) || 0,
      }));

      setTravelers(mappedTravelers);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const total = mappedTravelers.length;
      const active = mappedTravelers.filter(t => t.status === 'active').length;
      const suspended = mappedTravelers.filter(t => t.status === 'suspended').length;
      const newThisMonth = mappedTravelers.filter(t => 
        new Date(t.created_at) >= startOfMonth
      ).length;

      setStats({ total, active, suspended, newThisMonth });
    } catch (err) {
      console.error('Error fetching travelers:', err);
      setError('Failed to load travelers');
    } finally {
      setLoading(false);
    }
  };

  const updateTravelerStatus = async (travelerId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('travelers')
        .update({ status })
        .eq('id', travelerId);

      if (error) throw error;

      // Refresh data
      await fetchTravelers();
      return { success: true };
    } catch (err) {
      console.error('Error updating traveler status:', err);
      return { success: false, error: err };
    }
  };

  return {
    travelers,
    stats,
    loading,
    error,
    refetch: fetchTravelers,
    updateTravelerStatus,
  };
}
