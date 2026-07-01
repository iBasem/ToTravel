
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
            const { error } = await supabase
                .from('reviews')
                .insert({
                    traveler_id: user.id,
                    package_id: packageId,
                    booking_id: bookingId,
                    rating,
                    comment
                });

            if (error) throw error;

            toast.success('Review submitted successfully');
            fetchPackageReviews(packageId);
            return true;
        } catch (error: any) {
            console.error('Error submitting review:', error);
            if (error.code === '23505') {
                toast.error('You have already reviewed this booking');
            } else {
                toast.error('Failed to submit review');
            }
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
