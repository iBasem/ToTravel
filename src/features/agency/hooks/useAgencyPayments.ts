import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface AgencyPayment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    packageTitle: string;
    travelerName: string;
}

/**
 * Payment ledger for the agency's own bookings, read via the agency_payments
 * VIEW (wave 4, REG-8): the view exposes only display columns — the raw
 * provider payload and provider ids never leave the base table, whose
 * agency-facing policy was removed.
 */
export function useAgencyPayments(limit = 20) {
    const { user } = useAuth();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'payments', userId, limit],
        enabled: !!userId,
        queryFn: async (): Promise<AgencyPayment[]> => {
            const { data, error } = await supabase
                .from('agency_payments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return (data || []).map((p) => ({
                id: p.id ?? '',
                amount: Number(p.amount ?? 0),
                currency: p.currency ?? 'SAR',
                status: p.status ?? 'initiated',
                created_at: p.created_at ?? '',
                packageTitle: p.package_title ?? '',
                travelerName: p.traveler_name ?? '',
            }));
        },
    });

    return {
        payments: query.data ?? [],
        loading: query.isPending,
        error: query.error
            ? (query.error instanceof Error ? query.error.message : String(query.error))
            : null,
    };
}
