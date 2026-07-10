import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface FeedbackItem {
    id: string;
    travelerName: string;
    packageTitle: string;
    rating: number;
    comment: string;
    date: string;
    status: string;
}

export interface FeedbackStats {
    averageRating: number;
    totalReviews: number;
    pendingReviews: number;
    satisfactionRate: number;
}

export function useAgencyFeedback() {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [stats, setStats] = useState<FeedbackStats>({
        averageRating: 0,
        totalReviews: 0,
        pendingReviews: 0,
        satisfactionRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch reviews for this agency's packages
                const { data, error: fetchError } = await supabase
                    .from('reviews')
                    .select(`
            id,
            rating,
            comment,
            created_at,
            traveler:travelers ( first_name, last_name ),
            package:packages!inner ( title, agency_id )
          `)
                    .eq('packages.agency_id', user.id)
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;

                const mapped: FeedbackItem[] = (data || []).map((r) => ({
                    id: r.id,
                    travelerName: r.traveler
                        ? `${r.traveler.first_name ?? ''} ${r.traveler.last_name ?? ''}`.trim() || t('common.unknown', 'Unknown')
                        : t('common.unknown', 'Unknown'),
                    packageTitle: r.package?.title || t('common.unknownPackage'),
                    rating: r.rating,
                    comment: r.comment || '',
                    date: r.created_at,
                    status: 'published',
                }));

                setFeedbacks(mapped);

                // Compute stats
                const totalReviews = mapped.length;
                const avgRating = totalReviews > 0
                    ? mapped.reduce((sum, f) => sum + f.rating, 0) / totalReviews
                    : 0;
                const pendingReviews = mapped.filter(f => f.status === 'pending').length;
                const satisfactionRate = totalReviews > 0
                    ? Math.round(
                        (mapped.filter(f => f.rating >= 4).length / totalReviews) * 100
                    )
                    : 0;

                setStats({
                    averageRating: Math.round(avgRating * 10) / 10,
                    totalReviews,
                    pendingReviews,
                    satisfactionRate,
                });

            } catch (err) {
                console.error('Error fetching feedback:', err);
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, [user]);

    return { feedbacks, stats, loading, error };
}
