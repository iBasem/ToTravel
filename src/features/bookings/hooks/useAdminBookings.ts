import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAudit } from '@/features/admin/lib/audit';

export interface AdminBooking {
  id: string;
  booking_date: string;
  total_price: number;
  participants: number;
  status: string;
  payment_status: string;
  special_requests: string | null;
  package_title: string;
  package_title_ar: string | null;
  package_destination: string;
  traveler_name: string;
  traveler_email: string;
  agency_name: string;
  created_at: string;
  /** Latest paid payment for this booking, if any — the refund target. */
  paid_payment_id: string | null;
}

export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  thisMonth: number;
}

export interface AdminPayment {
  id: string;
  booking_id: string;
  provider: string;
  provider_invoice_id: string | null;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  traveler_name: string;
  package_title: string;
  package_title_ar: string | null;
}

export const adminBookingsKey = ['admin', 'bookings'] as const;
export const adminPaymentsKey = ['admin', 'payments'] as const;

interface BookingsBundle {
  bookings: AdminBooking[];
  payments: AdminPayment[];
  stats: BookingStats;
}

export function useAdminBookings() {
  return useQuery({
    queryKey: adminBookingsKey,
    queryFn: async (): Promise<BookingsBundle> => {
      const [bookingsRes, packagesRes, travelersRes, agenciesRes, paymentsRes] = await Promise.all([
        supabase.from('package_bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('packages').select('id, title, title_ar, destination, agency_id'),
        supabase.from('travelers').select('id, first_name, last_name, email'),
        supabase.from('travel_agencies').select('id, company_name'),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
      ]);
      for (const res of [bookingsRes, packagesRes, travelersRes, agenciesRes, paymentsRes]) {
        if (res.error) throw res.error;
      }

      const packageMap = new Map(packagesRes.data?.map((p) => [p.id, p]));
      const travelerMap = new Map(travelersRes.data?.map((t) => [t.id, t]));
      const agencyMap = new Map(agenciesRes.data?.map((a) => [a.id, a.company_name]));

      const paidPaymentByBooking = new Map<string, string>();
      for (const p of paymentsRes.data ?? []) {
        if (p.status === 'paid' && !paidPaymentByBooking.has(p.booking_id)) {
          paidPaymentByBooking.set(p.booking_id, p.id);
        }
      }

      const bookings: AdminBooking[] = (bookingsRes.data ?? []).map((b) => {
        const pkg = packageMap.get(b.package_id);
        const traveler = travelerMap.get(b.traveler_id);
        return {
          id: b.id,
          booking_date: b.booking_date,
          total_price: Number(b.total_price),
          participants: b.participants,
          status: b.status ?? 'pending',
          payment_status: b.payment_status ?? 'pending',
          special_requests: b.special_requests,
          package_title: pkg?.title ?? '',
          package_title_ar: pkg?.title_ar ?? null,
          package_destination: pkg?.destination ?? '',
          traveler_name: traveler ? `${traveler.first_name} ${traveler.last_name}` : '',
          traveler_email: traveler?.email ?? '',
          agency_name: (pkg && agencyMap.get(pkg.agency_id)) || '',
          created_at: b.created_at,
          paid_payment_id: paidPaymentByBooking.get(b.id) ?? null,
        };
      });

      const bookingMap = new Map(bookings.map((b) => [b.id, b]));
      const payments: AdminPayment[] = (paymentsRes.data ?? []).map((p) => {
        const booking = bookingMap.get(p.booking_id);
        return {
          id: p.id,
          booking_id: p.booking_id,
          provider: p.provider,
          provider_invoice_id: p.provider_invoice_id,
          provider_payment_id: p.provider_payment_id,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          created_at: p.created_at,
          traveler_name: booking?.traveler_name ?? '',
          package_title: booking?.package_title ?? '',
          package_title_ar: booking?.package_title_ar ?? null,
        };
      });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      return {
        bookings,
        payments,
        stats: {
          total: bookings.length,
          confirmed: bookings.filter((b) => b.status === 'confirmed').length,
          pending: bookings.filter((b) => b.status === 'pending').length,
          thisMonth: bookings.filter((b) => new Date(b.created_at) >= startOfMonth).length,
        },
      };
    },
  });
}

interface CancelBookingInput {
  bookingId: string;
  packageTitle: string;
  travelerName: string;
}

/**
 * Cancels a booking. Only touches `status` — payment_status is owned by the
 * payment provider flow (admin-refund / moyasar-webhook) and must never be
 * flipped from the client.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ bookingId }: CancelBookingInput) => {
      const { error } = await supabase
        .from('package_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: (_data, { bookingId, packageTitle, travelerName }) => {
      queryClient.invalidateQueries({ queryKey: adminBookingsKey });
      void audit({
        actionType: 'booking_cancellation',
        description: `Cancelled booking of "${packageTitle}" for ${travelerName}`,
        entityType: 'booking',
        entityId: bookingId,
        metadata: {},
      });
    },
  });
}

interface RefundInput {
  paymentId: string;
  reason?: string;
}

/**
 * Issues a refund through the admin-refund edge function, which verifies the
 * admin role, refunds at Moyasar, reconciles payment + booking rows and
 * writes the audit log server-side.
 */
export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: RefundInput) => {
      const { data, error } = await supabase.functions.invoke('admin-refund', {
        body: { payment_id: paymentId, reason: reason ?? '' },
      });
      if (error) {
        // Surface the structured error body when the function returned 4xx/5xx.
        const context = error as { context?: Response };
        if (context.context) {
          const body = await context.context.json().catch(() => null);
          throw new Error(body?.code ?? error.message);
        }
        throw error;
      }
      return data as { ok: boolean; payment_id: string; status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBookingsKey });
      queryClient.invalidateQueries({ queryKey: adminPaymentsKey });
    },
  });
}
