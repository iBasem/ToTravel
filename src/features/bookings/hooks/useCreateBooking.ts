import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

export interface BookingFormData {
    packageId: string;
    bookingDate: string;
    participants: number;
    specialRequests?: string;
}

export function useCreateBooking() {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const createBooking = async (formData: BookingFormData) => {
        if (!user) {
            toast.error('Please sign in to book this tour');
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
                },
            });

            if (error) {
                // Surface the function's error message when available
                let message = 'Failed to create booking';
                try {
                    const body = await (error as { context?: Response }).context?.json();
                    if (body?.error) message = body.error;
                } catch { /* keep generic message */ }
                throw new Error(message);
            }

            toast.success('Booking created successfully! We will contact you shortly.');
            return { success: true, data: data?.booking };
        } catch (error) {
            console.error('Booking creation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createBooking, loading };
}
