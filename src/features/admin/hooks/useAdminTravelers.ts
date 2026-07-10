import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAudit } from '../lib/audit';

export interface AdminTraveler {
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

export interface TravelerStats {
  total: number;
  active: number;
  suspended: number;
  newThisMonth: number;
}

export const adminTravelersKey = ['admin', 'travelers'] as const;

export function useAdminTravelers() {
  return useQuery({
    queryKey: adminTravelersKey,
    queryFn: async (): Promise<{ travelers: AdminTraveler[]; stats: TravelerStats }> => {
      const [travelersRes, bookingsRes] = await Promise.all([
        supabase.from('travelers').select('*').order('created_at', { ascending: false }),
        supabase.from('package_bookings').select('traveler_id'),
      ]);
      if (travelersRes.error) throw travelersRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      const bookingsMap = new Map<string, number>();
      for (const b of bookingsRes.data ?? []) {
        bookingsMap.set(b.traveler_id, (bookingsMap.get(b.traveler_id) ?? 0) + 1);
      }

      const travelers: AdminTraveler[] = (travelersRes.data ?? []).map((t) => ({
        id: t.id,
        first_name: t.first_name,
        last_name: t.last_name,
        email: t.email,
        phone: t.phone,
        avatar_url: t.avatar_url,
        status: t.status ?? 'active',
        created_at: t.created_at,
        bookings_count: bookingsMap.get(t.id) ?? 0,
      }));

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      return {
        travelers,
        stats: {
          total: travelers.length,
          active: travelers.filter((t) => t.status === 'active').length,
          suspended: travelers.filter((t) => t.status === 'suspended').length,
          newThisMonth: travelers.filter((t) => new Date(t.created_at) >= startOfMonth).length,
        },
      };
    },
  });
}

interface TravelerStatusInput {
  travelerId: string;
  travelerName: string;
  status: 'active' | 'suspended';
}

export function useUpdateTravelerStatus() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ travelerId, status }: TravelerStatusInput) => {
      const { error } = await supabase.from('travelers').update({ status }).eq('id', travelerId);
      if (error) throw error;
    },
    onSuccess: (_data, { travelerId, travelerName, status }) => {
      queryClient.invalidateQueries({ queryKey: adminTravelersKey });
      void audit({
        actionType: status === 'suspended' ? 'traveler_suspension' : 'traveler_activation',
        description: `Set traveler "${travelerName}" status to ${status}`,
        entityType: 'traveler',
        entityId: travelerId,
        metadata: { status },
      });
    },
  });
}

export interface TravelerBookingRow {
  id: string;
  booking_date: string;
  participants: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  package_title: string;
  package_title_ar: string | null;
}

/** One traveler's bookings, for the profile dialog. */
export function useTravelerBookings(travelerId: string | null) {
  return useQuery({
    queryKey: ['admin', 'traveler-bookings', travelerId],
    enabled: !!travelerId,
    queryFn: async (): Promise<TravelerBookingRow[]> => {
      const { data, error } = await supabase
        .from('package_bookings')
        .select('id, booking_date, participants, total_price, status, payment_status, created_at, packages(title, title_ar)')
        .eq('traveler_id', travelerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b) => {
        const pkg = b.packages as { title: string; title_ar: string | null } | null;
        return {
          id: b.id,
          booking_date: b.booking_date,
          participants: b.participants,
          total_price: Number(b.total_price),
          status: b.status ?? 'pending',
          payment_status: b.payment_status ?? 'pending',
          created_at: b.created_at,
          package_title: pkg?.title ?? '',
          package_title_ar: pkg?.title_ar ?? null,
        };
      });
    },
  });
}
