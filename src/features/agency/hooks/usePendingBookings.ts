import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

/**
 * Pending-bookings count for the agency header badge — the first push channel
 * beyond messages (audit: notifications gap). Realtime events on
 * package_bookings (RLS-scoped to this agency's rows) invalidate the count
 * and the bookings list, so new bookings surface without a page revisit.
 */
export function usePendingBookings() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;
    const enabled = !!userId && profile?.role === 'agency';

    const query = useQuery({
        queryKey: ['agency', 'pending-bookings-count', userId],
        enabled,
        queryFn: async () => {
            const { count, error } = await supabase
                .from('package_bookings')
                .select('id, packages!inner(agency_id)', { count: 'exact', head: true })
                .eq('packages.agency_id', userId!)
                .eq('status', 'pending');
            if (error) throw error;
            return count ?? 0;
        },
    });

    useEffect(() => {
        if (!enabled) return;
        const channel = supabase
            .channel(`agency-bookings-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'package_bookings' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['agency', 'pending-bookings-count', userId] });
                    queryClient.invalidateQueries({ queryKey: ['agency', 'bookings'] });
                    queryClient.invalidateQueries({ queryKey: ['agency', 'overview', userId] });
                },
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
        // Key on the id, not the object (auth events re-create the user object).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, userId]);

    return { pendingCount: query.data ?? 0 };
}
