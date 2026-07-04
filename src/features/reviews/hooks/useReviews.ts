
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

export type Review = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    traveler: {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
    };
};

export function useReviews() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);

    const fetchPackageReviews = useCallback(async (packageId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          id,
          rating,
          comment,
          created_at,
          traveler:travelers (
            first_name,
            last_name,
            avatar_url
          )
        `)
                .eq('package_id', packageId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const typedData = data as unknown as Review[];
            setReviews(typedData || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTravelerReviews = useCallback(async () => {
        if (!user) return [];
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          id,
          rating,
          comment,
          created_at,
          package:packages (
            id,
            title,
            package_media (
              file_path,
              is_primary
            )
          )
        `)
                .eq('traveler_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching traveler reviews:', error);
            toast.error('Failed to load your reviews');
            return [];
        } finally {
            setLoading(false);
        }
    }, [user]);

    const submitReview = async ({
        packageId,
        bookingId,
        rating,
        comment
    }: {
        packageId: string;
        bookingId: string;
        rating: number;
        comment: string;
    }) => {
        if (!user) return false;

        setSubmitting(true);
        try {
            // The edge function verifies the booking belongs to the caller and
            // is completed; package_id is derived server-side from the booking.
            const { error } = await supabase.functions.invoke('create-review', {
                body: {
                    booking_id: bookingId,
                    rating,
                    comment
                },
            });

            if (error) {
                let message = 'Failed to submit review';
                try {
                    const body = await (error as { context?: Response }).context?.json();
                    if (body?.error) message = body.error;
                } catch { /* keep generic message */ }
                throw new Error(message);
            }

            toast.success('Review submitted successfully');
            fetchPackageReviews(packageId);
            return true;
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to submit review');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        reviews,
        loading,
        submitting,
        fetchPackageReviews,
        fetchTravelerReviews,
        submitReview
    };
}
