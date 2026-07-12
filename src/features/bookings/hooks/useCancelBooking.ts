import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Cancels the traveler's own booking via the cancel-booking edge function.
 * The function verifies ownership and only allows pending/unpaid bookings —
 * paid bookings go through the admin-refund flow, never a client status flip.
 */
export function useCancelBooking() {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const cancelBooking = async (bookingId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: bookingId },
      });

      if (error) {
        // Prefer the function's stable error code (localizable);
        // fall back to its English message, then to a generic one.
        let message = t('toasts.bookingCancelFailed', 'Could not cancel the booking');
        try {
          const body = await (error as { context?: Response }).context?.json();
          if (body?.code) {
            message = t(`serverErrors.${body.code}`, { defaultValue: body.error || message });
          } else if (body?.error) {
            message = body.error;
          }
        } catch { /* keep generic message */ }
        throw new Error(message);
      }

      toast.success(t('toasts.bookingCancelled', 'Booking cancelled'));
      return { success: true };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toasts.bookingCancelFailed', 'Could not cancel the booking'));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { cancelBooking, loading };
}
