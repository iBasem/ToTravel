import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

export interface BookingFormData {
    packageId: string;
    bookingDate: string;
    participants: number;
    specialRequests?: string;
    departureId?: string;
}

export function useCreateBooking() {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { t } = useTranslation();

    const createBooking = async (formData: BookingFormData) => {
        if (!user) {
            toast.error(t('toasts.signInToBook'));
            return { success: false, error: 'Authentication required' };
        }

        setLoading(true);
        try {
            // Price is computed server-side by the edge function; the client
            // never supplies total_price.
            const { data, error } = await supabase.functions.invoke('create-booking', {
                body: {
                    package_id: formData.packageId,
                    booking_date: formData.bookingDate,
                    participants: formData.participants,
                    special_requests: formData.specialRequests || null,
                    departure_id: formData.departureId || null,
                },
            });

            if (error) {
                // Prefer the function's stable error code (localizable);
                // fall back to its English message, then to a generic one.
                let message = t('toasts.bookingCreateFailed');
                try {
                    const body = await (error as { context?: Response }).context?.json();
                    if (body?.code) {
                        message = t(`serverErrors.${body.code}`, {
                            defaultValue: body.error || message,
                            max: body.max,
                        });
                    } else if (body?.error) {
                        message = body.error;
                    }
                } catch { /* keep generic message */ }
                throw new Error(message);
            }

            toast.success(t('toasts.bookingCreated'));
            return { success: true, data: data?.booking };
        } catch (error) {
            console.error('Booking creation error:', error);
            const errorMessage = error instanceof Error ? error.message : t('toasts.bookingCreateFailed');
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createBooking, loading };
}
