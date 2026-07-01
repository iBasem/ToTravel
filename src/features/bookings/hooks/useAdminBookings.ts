import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface Booking {
  id: string;
  booking_date: string;
  total_price: number;
  participants: number;
  status: string;
  payment_status: string;
  special_requests: string | null;
  package_title: string;
  package_destination: string;
  traveler_name: string;
  traveler_email: string;
  agency_name: string;
  created_at: string;
}

interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  thisMonth: number;
}

export function useAdminBookings() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
    }
  }, [isAdmin]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('package_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch packages for titles
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('id, title, destination, agency_id');

      if (packagesError) throw packagesError;

      // Fetch travelers
      const { data: travelersData, error: travelersError } = await supabase
        .from('travelers')
        .select('id, first_name, last_name, email');

      if (travelersError) throw travelersError;

      // Fetch agencies
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('travel_agencies')
        .select('id, company_name');

      if (agenciesError) throw agenciesError;

      // Create maps
      const packageMap = new Map(packagesData?.map(p => [p.id, p]));
      const travelerMap = new Map(travelersData?.map(t => [t.id, t]));
      const agencyMap = new Map(agenciesData?.map(a => [a.id, a.company_name]));

      // Map bookings with related data
      const mappedBookings: Booking[] = (bookingsData || []).map(b => {
        const pkg = packageMap.get(b.package_id);
        const traveler = travelerMap.get(b.traveler_id);
        const agencyName = pkg ? agencyMap.get(pkg.agency_id) || 'Unknown' : 'Unknown';

        return {
          id: b.id,
          booking_date: b.booking_date,
          total_price: Number(b.total_price),
          participants: b.participants,
          status: b.status || 'pending',
          payment_status: b.payment_status || 'pending',
          special_requests: b.special_requests,
          package_title: pkg?.title || 'Unknown Package',
          package_destination: pkg?.destination || 'Unknown',
          traveler_name: traveler ? `${traveler.first_name} ${traveler.last_name}` : 'Unknown',
          traveler_email: traveler?.email || '',
          agency_name: agencyName,
          created_at: b.created_at,
        };
      });

      setBookings(mappedBookings);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const total = mappedBookings.length;
      const confirmed = mappedBookings.filter(b => b.status === 'confirmed').length;
      const pending = mappedBookings.filter(b => b.status === 'pending').length;
      const thisMonth = mappedBookings.filter(b => 
        new Date(b.created_at) >= startOfMonth
      ).length;

      setStats({ total, confirmed, pending, thisMonth });
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    try {
      const updateData: { status: string; payment_status?: string } = { status };
      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const { error } = await supabase
        .from('package_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('Error updating booking status:', err);
      return { success: false, error: err };
    }
  };

  return {
    bookings,
    stats,
    loading,
    error,
    refetch: fetchBookings,
    updateBookingStatus,
  };
}
