import { useQuery } from '@tanstack/react-query';
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
}

export interface FeedbackStats {
    averageRating: number;
    totalReviews: number;
    recentReviews: number;
    satisfactionRate: number;
}

const EMPTY_STATS: FeedbackStats = {
    averageRating: 0,
    totalReviews: 0,
    recentReviews: 0,
    satisfactionRate: 0,
};

async function fetchFeedback(
    userId: string,
    t: (key: string, fallback?: string) => string,
): Promise<{ feedbacks: FeedbackItem[]; stats: FeedbackStats }> {
    // Bounded (audit AGY-28): stats derive from the 200 most recent reviews.
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            comment,
            created_at,
            traveler:travelers ( first_name, last_name ),
            package:packages!inner ( title, agency_id )
          `)
        .eq('package.agency_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) throw error;

    const feedbacks: FeedbackItem[] = (data || []).map((r) => ({
        id: r.id,
        travelerName: r.traveler
            ? `${r.traveler.first_name ?? ''} ${r.traveler.last_name ?? ''}`.trim() || t('common.unknown', 'Unknown')
            : t('common.unknown', 'Unknown'),
        packageTitle: r.package?.title || t('common.unknownPackage'),
        rating: r.rating,
        comment: r.comment || '',
        date: r.created_at,
    }));

    const totalReviews = feedbacks.length;
    const avgRating = totalReviews > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews
        : 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = feedbacks.filter((f) => new Date(f.date) >= thirtyDaysAgo).length;
    const satisfactionRate = totalReviews > 0
        ? Math.round((feedbacks.filter((f) => f.rating >= 4).length / totalReviews) * 100)
        : 0;

    return {
        feedbacks,
        stats: {
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews,
            recentReviews,
            satisfactionRate,
        },
    };
}

export function useAgencyFeedback() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'feedback', userId],
        enabled: !!userId,
        queryFn: () => fetchFeedback(userId!, t),
    });

    return {
        feedbacks: query.data?.feedbacks ?? [],
        stats: query.data?.stats ?? EMPTY_STATS,
        loading: query.isPending,
        error: query.error
            ? (query.error instanceof Error ? query.error.message : String(query.error))
            : null,
    };
}
