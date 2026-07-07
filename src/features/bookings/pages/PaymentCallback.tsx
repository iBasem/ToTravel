import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';

type State = 'checking' | 'paid' | 'pending' | 'failed';

// Return page after the Moyasar hosted checkout. The booking is marked paid by
// the webhook (not here); this page polls the real booking status and reflects
// it, so it can't be spoofed by tampering with the callback URL.
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const bookingId = params.get('booking');
  const moyasarStatus = params.get('status'); // Moyasar appends status to callback_url
  const { t } = useTranslation();
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    if (!bookingId) {
      setState('failed');
      return;
    }
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      const { data } = await supabase
        .from('package_bookings')
        .select('payment_status')
        .eq('id', bookingId)
        .maybeSingle();
      if (cancelled) return;
      if (data?.payment_status === 'paid') { setState('paid'); return; }
      if (moyasarStatus === 'failed') { setState('failed'); return; }
      if (attempts >= 6) { setState('pending'); return; } // webhook may still be arriving
      setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [bookingId, moyasarStatus]);

  const content: Record<State, { icon: JSX.Element; title: string; desc: string }> = {
    checking: {
      icon: <Loader2 className="w-12 h-12 animate-spin text-primary" />,
      title: t('payments.checking', 'Confirming your payment...'),
      desc: t('payments.checkingDesc', 'This only takes a moment.'),
    },
    paid: {
      icon: <CheckCircle2 className="w-12 h-12 text-green-600" />,
      title: t('payments.paidTitle', 'Payment successful'),
      desc: t('payments.paidDesc', 'Your booking is confirmed.'),
    },
    pending: {
      icon: <Clock className="w-12 h-12 text-yellow-500" />,
      title: t('payments.pendingTitle', 'Payment received, finalizing'),
      desc: t('payments.pendingDesc', "We're confirming your payment — your booking will update shortly."),
    },
    failed: {
      icon: <XCircle className="w-12 h-12 text-destructive" />,
      title: t('payments.failedTitle', 'Payment not completed'),
      desc: t('payments.failedDesc', 'No charge was made. You can try again from your bookings.'),
    },
  };
  const c = content[state];

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">{c.icon}</div>
        <h1 className="text-2xl font-bold">{c.title}</h1>
        <p className="text-muted-foreground">{c.desc}</p>
        <Button asChild>
          <Link to="/traveler/dashboard/bookings">{t('payments.viewBookings', 'View my bookings')}</Link>
        </Button>
      </div>
    </div>
  );
}
