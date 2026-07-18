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
 * Payment ledger for the agency's own bookings (wave3 RLS policy). Read-only
 * finance visibility — writes stay with the edge functions/webhook.
 */
export function useAgencyPayments(limit = 20) {
    const { user } = useAuth();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'payments', userId, limit],
        enabled: !!userId,
        queryFn: async (): Promise<AgencyPayment[]> => {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    id, amount, currency, status, created_at,
                    booking:package_bookings!inner (
                        packages!inner ( title, agency_id ),
                        travelers ( first_name, last_name )
                    )
                `)
                .eq('booking.packages.agency_id', userId!)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return (data || []).map((p) => ({
                id: p.id,
                amount: Number(p.amount),
                currency: p.currency,
                status: p.status,
                created_at: p.created_at,
                packageTitle: p.booking?.packages?.title ?? '',
                travelerName: p.booking?.travelers
                    ? `${p.booking.travelers.first_name ?? ''} ${p.booking.travelers.last_name ?? ''}`.trim()
                    : '',
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
