import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

export interface BookingFormData {
    packageId: string;
    bookingDate: string;
    participants: number;
    specialRequests?: string;
    // basePrice removed, will fetch from DB
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
            // Fetch fresh price from DB
            const { data: packageData, error: priceError } = await supabase
                .from('packages')
                .select('base_price')
                .eq('id', formData.packageId)
                .single();

            if (priceError) throw new Error('Could not fetch package details');

            const totalPrice = packageData.base_price * formData.participants;

            const { data, error } = await supabase
                .from('package_bookings')
                .insert({
                    package_id: formData.packageId,
                    traveler_id: user.id,
                    booking_date: formData.bookingDate,
                    participants: formData.participants,
                    total_price: totalPrice,
                    special_requests: formData.specialRequests || null,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Booking created successfully! We will contact you shortly.');
            return { success: true, data };
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
