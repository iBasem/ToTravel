import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { shortId } from '@/lib/utils';

export interface RecentConversation {
    id: string;
    travelerName: string;
    lastMessage: string;
    lastMessageTime: string;
    unread: boolean;
}

/**
 * Lightweight dashboard-card query (audit AGY-9): the Dashboard previously
 * mounted the full useAgencyMessages hook — the ENTIRE message history plus a
 * realtime channel — to render four rows. This reads the latest 40 messages,
 * groups them into at most `limit` conversations, and resolves names for only
 * those counterparties.
 */
export function useRecentConversations(limit = 4) {
    const { user } = useAuth();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'recent-conversations', userId, limit],
        enabled: !!userId,
        queryFn: async (): Promise<RecentConversation[]> => {
            const { data, error } = await supabase
                .from('messages')
                .select('id, sender_id, recipient_id, content, created_at, read_at')
                .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(40);
            if (error) throw error;

            const convMap = new Map<string, RecentConversation>();
            for (const msg of data || []) {
                const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
                const isUnreadIncoming = msg.recipient_id === userId && !msg.read_at;
                const existing = convMap.get(otherId);
                if (!existing) {
                    convMap.set(otherId, {
                        id: otherId,
                        travelerName: shortId(otherId),
                        lastMessage: msg.content,
                        lastMessageTime: msg.created_at,
                        unread: isUnreadIncoming,
                    });
                    if (convMap.size >= limit) {
                        // Names still need resolving, but no more grouping needed.
                    }
                } else if (isUnreadIncoming) {
                    existing.unread = true;
                }
            }

            const conversations = Array.from(convMap.values()).slice(0, limit);
            const ids = conversations.map((c) => c.id);
            if (ids.length > 0) {
                const [{ data: travelerRows }, { data: agencyRows }] = await Promise.all([
                    supabase.from('travelers').select('id, first_name, last_name').in('id', ids),
                    supabase.from('travel_agencies').select('id, company_name').in('id', ids),
                ]);
                travelerRows?.forEach((tr) => {
                    const conv = conversations.find((c) => c.id === tr.id);
                    if (!conv) return;
                    const name = `${tr.first_name ?? ''} ${tr.last_name ?? ''}`.trim();
                    if (name) conv.travelerName = name;
                });
                agencyRows?.forEach((ag) => {
                    const conv = conversations.find((c) => c.id === ag.id);
                    if (conv && ag.company_name) conv.travelerName = ag.company_name;
                });
            }
            return conversations;
        },
    });

    return { conversations: query.data ?? [], loading: query.isPending };
}
