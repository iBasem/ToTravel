import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Deal {
    id: string;
    title: string;
    discount_percentage: number;
    start_date: string;
    end_date: string;
    status: string;
    package_id: string | null;
    created_at: string;
}

export function useAgencyDeals() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchDeals = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('deals')
                .select('*')
                .eq('agency_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setDeals(data || []);
        } catch (err) {
            console.error('Error fetching deals:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const addDeal = async (deal: {
        title: string;
        discount_percentage: number;
        start_date: string;
        end_date: string;
        status?: string;
        package_id?: string;
    }) => {
        if (!user) return;

        try {
            const { data, error: insertError } = await supabase
                .from('deals')
                .insert({ ...deal, agency_id: user.id })
                .select()
                .single();

            if (insertError) throw insertError;
            setDeals(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error('Error adding deal:', err);
            throw err;
        }
    };

    const deleteDeal = async (dealId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('deals')
                .delete()
                .eq('id', dealId);

            if (deleteError) throw deleteError;
            setDeals(prev => prev.filter(d => d.id !== dealId));
        } catch (err) {
            console.error('Error deleting deal:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchDeals();
    }, [user]);

    return { deals, loading, error, addDeal, deleteDeal, refetch: fetchDeals };
}
