import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
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

/**
 * Admin moderation queue for agency deals. Admins see every deal (RLS
 * "Admins can view all deals") and can approve/reject via the
 * "Admins can update all deals" policy; the guard_deal_approval trigger
 * blocks the same transition for non-admins.
 */
export function useAdminDeals() {
    const { profile } = useAuth();
    const [deals, setDeals] = useState<AdminDeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = profile?.role === 'admin';

    const fetchDeals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('deals')
                .select('*, travel_agencies(company_name), packages(title, title_ar, base_price)')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setDeals((data as AdminDeal[]) ?? []);
        } catch (err) {
            console.error('Error fetching deals:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch deals');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchDeals();
        }
    }, [isAdmin, fetchDeals]);

    const setApproval = async (dealId: string, approval: 'approved' | 'rejected') => {
        const { error: updateError } = await supabase
            .from('deals')
            .update({ approval_status: approval })
            .eq('id', dealId);

        if (updateError) {
            console.error('Error updating deal approval:', updateError);
            return { success: false as const, error: updateError.message };
        }

        setDeals(prev => prev.map(d => (d.id === dealId ? { ...d, approval_status: approval } : d)));
        return { success: true as const };
    };

    const today = new Date().toISOString().slice(0, 10);
    const stats: DealStats = {
        total: deals.length,
        pending: deals.filter(d => d.approval_status === 'pending').length,
        approved: deals.filter(d => d.approval_status === 'approved').length,
        rejected: deals.filter(d => d.approval_status === 'rejected').length,
        liveNow: deals.filter(
            d => d.approval_status === 'approved' && d.status === 'active' && d.start_date <= today && d.end_date >= today
        ).length,
    };

    return {
        deals,
        stats,
        loading,
        error,
        approveDeal: (id: string) => setApproval(id, 'approved'),
        rejectDeal: (id: string) => setApproval(id, 'rejected'),
        refetch: fetchDeals,
    };
}
