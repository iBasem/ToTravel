import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/features/auth/context/AuthContext';
import { logAgencyAction } from '@/features/agency/lib/audit';

// Derived from the generated schema so column renames fail at compile time
// instead of runtime (AGY-43).
export type Deal = Database['public']['Tables']['deals']['Row'];

export function useAgencyDeals() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'deals', userId],
        enabled: !!userId,
        queryFn: async (): Promise<Deal[]> => {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .eq('agency_id', userId!)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agency', 'deals', userId] });

    const addDeal = async (deal: {
        title: string;
        discount_percentage: number;
        start_date: string;
        end_date: string;
        status?: string;
        package_id?: string;
    }) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('deals')
            .insert({ ...deal, agency_id: user.id })
            .select()
            .single();
        if (error) throw error;
        void logAgencyAction(userId, {
            actionType: 'deal_created',
            description: `Deal "${deal.title}" created`,
            entityType: 'deal',
            entityId: data?.id,
        });
        await invalidate();
        return data;
    };

    // A material edit (discount/dates/package) is sent back to review by the DB
    // guard, which also clears any stale rejection_reason — the resubmit path.
    const updateDeal = async (
        dealId: string,
        patch: Partial<Pick<Deal, 'title' | 'discount_percentage' | 'start_date' | 'end_date' | 'status' | 'package_id'>>,
    ) => {
        const { data, error } = await supabase
            .from('deals')
            .update(patch)
            .eq('id', dealId)
            .select()
            .single();
        if (error) throw error;
        void logAgencyAction(userId, {
            actionType: 'deal_updated',
            description: `Deal ${dealId} updated (resubmitted for review on material change)`,
            entityType: 'deal',
            entityId: dealId,
        });
        await invalidate();
        return data;
    };

    const deleteDeal = async (dealId: string) => {
        const { error } = await supabase.from('deals').delete().eq('id', dealId);
        if (error) throw error;
        void logAgencyAction(userId, {
            actionType: 'deal_deleted',
            description: `Deal ${dealId} deleted`,
            entityType: 'deal',
            entityId: dealId,
        });
        await invalidate();
    };

    return {
        deals: query.data ?? [],
        loading: query.isPending,
        error: query.error
            ? (query.error instanceof Error ? query.error.message : String(query.error))
            : null,
        addDeal,
        updateDeal,
        deleteDeal,
        refetch: query.refetch,
    };
}
