import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface AppNotification {
    id: string;
    type: string;
    title_key: string;
    body_params: Record<string, string>;
    entity_type: string | null;
    entity_id: string | null;
    read_at: string | null;
    created_at: string;
}

/**
 * Decision notifications (deal approved/rejected, package published/suspended/
 * archived) written by DB triggers on admin actions. Realtime INSERTs
 * invalidate the list so the bell updates without a revisit.
 */
export function useNotifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'notifications', userId],
        enabled: !!userId,
        queryFn: async () => {
            const [{ data, error }, { count, error: countError }] = await Promise.all([
                supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId!)
                    .order('created_at', { ascending: false })
                    .limit(20),
                supabase
                    .from('notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId!)
                    .is('read_at', null),
            ]);
            if (error) throw error;
            if (countError) throw countError;
            return {
                notifications: (data || []) as AppNotification[],
                unreadCount: count ?? 0,
            };
        },
    });

    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                () => queryClient.invalidateQueries({ queryKey: ['agency', 'notifications', userId] }),
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
        // Key on the id, not the object (auth events re-create the user object).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const markAllRead = async () => {
        if (!userId) return;
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('read_at', null);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['agency', 'notifications', userId] });
    };

    return {
        notifications: query.data?.notifications ?? [],
        unreadCount: query.data?.unreadCount ?? 0,
        markAllRead,
    };
}
