import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAudit } from '../lib/audit';
import type { Database } from '@/integrations/supabase/types';

type DealRow = Database['public']['Tables']['deals']['Row'];

export interface AdminDeal extends DealRow {
    travel_agencies: { company_name: string } | null;
    packages: { title: string; title_ar: string | null; base_price: number } | null;
}

export interface DealStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    liveNow: number;
}

export const adminDealsKey = ['admin', 'deals'] as const;

/**
 * Admin moderation queue for agency deals. Admins see every deal (RLS
 * "Admins can view all deals") and can approve/reject via the
 * "Admins can update all deals" policy; the guard_deal_approval trigger
 * blocks the same transition for non-admins.
 */
export function useAdminDeals() {
    return useQuery({
        queryKey: adminDealsKey,
        queryFn: async (): Promise<{ deals: AdminDeal[]; stats: DealStats }> => {
            const { data, error } = await supabase
                .from('deals')
                .select('*, travel_agencies(company_name), packages(title, title_ar, base_price)')
                .order('created_at', { ascending: false });
            if (error) throw error;

            const deals = (data as AdminDeal[]) ?? [];
            const today = new Date().toISOString().slice(0, 10);
            return {
                deals,
                stats: {
                    total: deals.length,
                    pending: deals.filter(d => d.approval_status === 'pending').length,
                    approved: deals.filter(d => d.approval_status === 'approved').length,
                    rejected: deals.filter(d => d.approval_status === 'rejected').length,
                    liveNow: deals.filter(
                        d => d.approval_status === 'approved' && d.status === 'active' && d.start_date <= today && d.end_date >= today
                    ).length,
                },
            };
        },
    });
}

interface DealApprovalInput {
    dealId: string;
    dealTitle: string;
    approval: 'approved' | 'rejected';
    /** Shown to the agency on the rejected deal card (wave3, AGY audit dead-end). */
    reason?: string;
}

export function useSetDealApproval() {
    const queryClient = useQueryClient();
    const audit = useAdminAudit();

    return useMutation({
        mutationFn: async ({ dealId, approval, reason }: DealApprovalInput) => {
            const { error } = await supabase
                .from('deals')
                .update({
                    approval_status: approval,
                    rejection_reason: approval === 'rejected' ? (reason?.trim() || null) : null,
                })
                .eq('id', dealId);
            if (error) throw error;
        },
        onSuccess: (_data, { dealId, dealTitle, approval }) => {
            queryClient.invalidateQueries({ queryKey: adminDealsKey });
            queryClient.invalidateQueries({ queryKey: ['active-deals'] });
            void audit({
                actionType: approval === 'approved' ? 'deal_approval' : 'deal_rejection',
                description: `${approval === 'approved' ? 'Approved' : 'Rejected'} deal "${dealTitle}"`,
                entityType: 'deal',
                entityId: dealId,
                metadata: { approval_status: approval },
            });
        },
    });
}
