import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Starts a hosted Moyasar payment for a booking. The edge function creates the
 * invoice server-side (amount from the booking, never the client) and returns
 * its URL; we redirect the browser there. The booking is only marked paid later
 * by the verified webhook.
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const startPayment = async (bookingId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { booking_id: bookingId },
      });

      if (error) {
        let message = t('payments.startFailed', 'Could not start payment');
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

      if (data?.url) {
        window.location.href = data.url; // hand off to Moyasar's hosted page
        return { success: true };
      }
      throw new Error(t('payments.startFailed', 'Could not start payment'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('payments.startFailed', 'Could not start payment'));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { startPayment, loading };
}
