
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);

    const fetchPackageReviews = useCallback(async (packageId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('id, rating, comment, created_at')
                .eq('package_id', packageId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Reviewer display identity comes from the review_authors RPC,
            // which is callable by everyone (traveler rows themselves are not
            // publicly readable).
            const rows = data || [];
            const authorsById = new Map<string, Review['traveler']>();
            if (rows.length > 0) {
                const { data: authors } = await supabase.rpc('review_authors', {
                    review_ids: rows.map(r => r.id),
                });
                authors?.forEach(a => {
                    if (a.review_id) {
                        authorsById.set(a.review_id, {
                            first_name: a.first_name,
                            last_name: a.last_name,
                            avatar_url: a.avatar_url,
                        });
                    }
                });
            }

            setReviews(rows.map(r => ({
                ...r,
                traveler: authorsById.get(r.id) ?? {
                    first_name: null,
                    last_name: null,
                    avatar_url: null,
                },
            })));
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error(t('toasts.reviewsLoadFailed'));
        } finally {
            setLoading(false);
        }
    }, [t]);

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
            title_ar,
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
            toast.error(t('toasts.yourReviewsLoadFailed'));
            return [];
        } finally {
            setLoading(false);
        }
    }, [user, t]);

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
                // Prefer the function's stable error code (localizable);
                // fall back to its English message, then to a generic one.
                let message = t('toasts.reviewSubmitFailed');
                try {
                    const body = await (error as { context?: Response }).context?.json();
                    if (body?.code) {
                        message = t(`serverErrors.${body.code}`, {
                            defaultValue: body.error || message,
                        });
                    } else if (body?.error) {
                        message = body.error;
                    }
                } catch { /* keep generic message */ }
                throw new Error(message);
            }

            toast.success(t('toasts.reviewSubmitted'));
            fetchPackageReviews(packageId);
            return true;
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error instanceof Error ? error.message : t('toasts.reviewSubmitFailed'));
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
