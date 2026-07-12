
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Booking {
  id: string;
  package_id: string;
  traveler_id: string;
  booking_date: string;
  participants: number;
  total_price: number;
  status: string;
  special_requests: string;
  created_at: string;
  updated_at: string;
  packages?: {
    title: string;
    title_ar?: string | null;
    destination: string;
    destination_ar?: string | null;
    duration_days: number;
  };
  travelers?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

import { useAuth } from '@/features/auth/context/AuthContext';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchBookings = useCallback(async () => {
      if (!user || !profile) return;
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('package_bookings')
          .select(`
            *,
            packages!inner (
              title,
              title_ar,
              destination,
              destination_ar,
              duration_days,
              agency_id,
              package_media (
                file_path
              )
            ),
            travelers (
              first_name,
              last_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        if (profile.role === 'traveler') {
          query = query.eq('traveler_id', user.id);
        } else if (profile.role === 'agency') {
          query = query.eq('packages.agency_id', user.id);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw supabaseError;
        }

        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    // Key on stable ids, not object identity (auth events re-create both).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.role]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('package_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking =>
        booking.id === bookingId ? { ...booking, status } : booking
      ));

      return { success: true };
    } catch (err) {
      console.error('Error updating booking status:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update booking' };
    }
  };

  return { bookings, loading, error, updateBookingStatus, refetch: fetchBookings };
}
