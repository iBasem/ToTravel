
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { logAgencyAction } from '@/features/agency/lib/audit';

export interface Booking {
  id: string;
  package_id: string;
  traveler_id: string;
  booking_date: string;
  participants: number;
  total_price: number;
  status: string;
  payment_status: string | null;
  special_requests: string;
  cancellation_reason: string | null;
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

async function fetchBookings(userId: string, role: string): Promise<Booking[]> {
  // Bounded (audit AGY-28): 200 most recent; the unused package_media embed
  // is dropped (it was fetched and never rendered).
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
        agency_id
      ),
      travelers (
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (role === 'traveler') {
    query = query.eq('traveler_id', userId);
  } else if (role === 'agency') {
    query = query.eq('packages.agency_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as Booking[];
}

export function useBookings() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const role = profile?.role;

  const query = useQuery({
    queryKey: ['agency', 'bookings', userId, role],
    enabled: !!userId && !!role,
    queryFn: () => fetchBookings(userId!, role!),
  });

  const updateBookingStatus = async (
    bookingId: string,
    status: string,
    options?: { cancellationReason?: string },
  ) => {
    try {
      const patch: Record<string, string> = { status, updated_at: new Date().toISOString() };
      if (status === 'cancelled' && options?.cancellationReason?.trim()) {
        patch.cancellation_reason = options.cancellationReason.trim();
      }
      const { error } = await supabase
        .from('package_bookings')
        .update(patch)
        .eq('id', bookingId);

      if (error) throw error;

      if (role === 'agency') {
        void logAgencyAction(userId, {
          actionType: `booking_${status}`,
          description: `Booking ${bookingId} set to ${status}`,
          entityType: 'booking',
          entityId: bookingId,
          metadata: options?.cancellationReason ? { reason: options.cancellationReason } : {},
        });
      }

      // A status change moves revenue/trip numbers everywhere: refresh every
      // agency-scoped query (overview, bookings, calendar, travelers).
      await queryClient.invalidateQueries({ queryKey: ['agency'] });

      return { success: true };
    } catch (err) {
      console.error('Error updating booking status:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update booking' };
    }
  };

  return {
    bookings: query.data ?? [],
    loading: query.isPending,
    error: query.error
      ? (query.error instanceof Error ? query.error.message : 'Failed to fetch bookings')
      : null,
    updateBookingStatus,
    refetch: query.refetch,
  };
}
