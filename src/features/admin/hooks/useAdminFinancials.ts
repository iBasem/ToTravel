import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/formatters';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAdminAudit } from '../lib/audit';

export interface AdminPayout {
  id: string;
  agency_id: string;
  agency_name: string;
  period_start: string;
  period_end: string;
  amount: number;
  commission_rate: number;
  status: string;
  processed_at: string | null;
  payment_reference: string | null;
  created_at: string;
}

export interface FinancialStats {
  totalRevenue: number;
  platformCommission: number;
  pendingPayouts: number;
  processedPayouts: number;
  pendingPayoutsCount: number;
}

export interface RevenueData {
  name: string;
  revenue: number;
  commission: number;
}

interface BookingWithRate {
  total_price: number | null;
  created_at: string;
  status: string | null;
  packages?: { travel_agencies?: { commission_rate: number | null } | null } | null;
}

export const adminFinancialsKey = ['admin', 'financials'] as const;

export function useAdminFinancials() {
  return useQuery({
    queryKey: adminFinancialsKey,
    queryFn: async (): Promise<{ payouts: AdminPayout[]; stats: FinancialStats; revenueData: RevenueData[] }> => {
      const [bookingsRes, settingsRes, payoutsRes, agenciesRes] = await Promise.all([
        supabase
          .from('package_bookings')
          .select('total_price, created_at, status, packages ( travel_agencies ( commission_rate ) )'),
        supabase.from('platform_settings').select('commission_rate').maybeSingle(),
        supabase.from('agency_payouts').select('*').order('created_at', { ascending: false }),
        supabase.from('travel_agencies').select('id, company_name'),
      ]);
      if (bookingsRes.error) throw bookingsRes.error;
      if (payoutsRes.error) throw payoutsRes.error;
      if (agenciesRes.error) throw agenciesRes.error;

      const defaultCommissionRate = Number(settingsRes.data?.commission_rate ?? 0.12);
      const bookingCommissionRate = (b: BookingWithRate) =>
        Number(b.packages?.travel_agencies?.commission_rate ?? defaultCommissionRate);

      const agencyMap = new Map<string, string>();
      for (const a of agenciesRes.data ?? []) agencyMap.set(a.id, a.company_name);

      const payouts: AdminPayout[] = (payoutsRes.data ?? []).map((p) => ({
        id: p.id,
        agency_id: p.agency_id,
        agency_name: agencyMap.get(p.agency_id) ?? '',
        period_start: p.period_start,
        period_end: p.period_end,
        amount: Number(p.amount),
        commission_rate: Number(p.commission_rate),
        status: p.status,
        processed_at: p.processed_at,
        payment_reference: p.payment_reference,
        created_at: p.created_at,
      }));

      const bookings = (bookingsRes.data ?? []) as BookingWithRate[];
      const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price ?? 0), 0);
      const platformCommission = confirmedBookings.reduce(
        (sum, b) => sum + Number(b.total_price ?? 0) * bookingCommissionRate(b),
        0,
      );

      const monthlyData = new Map<string, { revenue: number; commission: number }>();
      const months = Array.from({ length: 12 }, (_, m) => formatDate(new Date(2026, m, 1), 'MMM'));
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyData.set(months[date.getMonth()], { revenue: 0, commission: 0 });
      }
      for (const b of bookings) {
        const monthKey = months[new Date(b.created_at).getMonth()];
        const existing = monthlyData.get(monthKey);
        if (existing) {
          const revenue = Number(b.total_price ?? 0);
          existing.revenue += revenue;
          existing.commission += revenue * bookingCommissionRate(b);
        }
      }

      return {
        payouts,
        stats: {
          totalRevenue,
          platformCommission,
          pendingPayouts: payouts.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
          processedPayouts: payouts.filter((p) => p.status === 'processed').reduce((s, p) => s + p.amount, 0),
          pendingPayoutsCount: payouts.filter((p) => p.status === 'pending').length,
        },
        revenueData: Array.from(monthlyData.entries()).map(([name, d]) => ({
          name,
          revenue: Math.round(d.revenue),
          commission: Math.round(d.commission),
        })),
      };
    },
  });
}

interface ProcessPayoutInput {
  payoutIds: string[];
  /** Bank transfer / provider reference recorded on the payout rows. */
  paymentReference: string;
  agencyNames: string[];
  totalAmount: number;
}

export function useProcessPayouts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ payoutIds, paymentReference }: ProcessPayoutInput) => {
      const { error } = await supabase
        .from('agency_payouts')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          payment_reference: paymentReference || null,
        })
        .in('id', payoutIds);
      if (error) throw error;
    },
    onSuccess: (_data, { payoutIds, paymentReference, agencyNames, totalAmount }) => {
      queryClient.invalidateQueries({ queryKey: adminFinancialsKey });
      void audit({
        actionType: 'payout_processed',
        description: `Marked ${payoutIds.length} payout(s) as processed for ${agencyNames.join(', ')} (SAR ${totalAmount.toFixed(2)})${paymentReference ? ` — ref ${paymentReference}` : ''}`,
        entityType: 'payout',
        entityId: payoutIds.length === 1 ? payoutIds[0] : null,
        metadata: { payout_ids: payoutIds, payment_reference: paymentReference, total_amount: totalAmount },
      });
    },
  });
}
