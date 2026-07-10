import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAudit } from '../lib/audit';

export interface AdminReview {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    traveler_name: string;
    traveler_email: string;
    package_title: string;
    package_destination: string;
    agency_name: string;
}

export interface ReviewStats {
    total: number;
    averageRating: number;
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
    thisMonth: number;
}

export const adminReviewsKey = ['admin', 'reviews'] as const;

export function useAdminReviews() {
    return useQuery({
        queryKey: adminReviewsKey,
        queryFn: async (): Promise<{ reviews: AdminReview[]; stats: ReviewStats }> => {
            const [reviewsRes, travelersRes, packagesRes, agenciesRes] = await Promise.all([
                supabase.from('reviews').select('*').order('created_at', { ascending: false }),
                supabase.from('travelers').select('id, first_name, last_name, email'),
                supabase.from('packages').select('id, title, destination, agency_id'),
                supabase.from('travel_agencies').select('id, company_name'),
            ]);
            for (const res of [reviewsRes, travelersRes, packagesRes, agenciesRes]) {
                if (res.error) throw res.error;
            }

            const travelerMap = new Map(travelersRes.data?.map(t => [t.id, t]));
            const packageMap = new Map(packagesRes.data?.map(p => [p.id, p]));
            const agencyMap = new Map(agenciesRes.data?.map(a => [a.id, a.company_name]));

            const reviews: AdminReview[] = (reviewsRes.data ?? []).map(r => {
                const traveler = travelerMap.get(r.traveler_id);
                const pkg = packageMap.get(r.package_id);
                return {
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    created_at: r.created_at,
                    traveler_name: traveler ? `${traveler.first_name} ${traveler.last_name}` : '',
                    traveler_email: traveler?.email ?? '',
                    package_title: pkg?.title ?? '',
                    package_destination: pkg?.destination ?? '',
                    agency_name: (pkg && agencyMap.get(pkg.agency_id)) || '',
                };
            });

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const total = reviews.length;
            return {
                reviews,
                stats: {
                    total,
                    averageRating:
                        total > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10 : 0,
                    fiveStars: reviews.filter(r => r.rating === 5).length,
                    fourStars: reviews.filter(r => r.rating === 4).length,
                    threeStars: reviews.filter(r => r.rating === 3).length,
                    twoStars: reviews.filter(r => r.rating === 2).length,
                    oneStar: reviews.filter(r => r.rating === 1).length,
                    thisMonth: reviews.filter(r => new Date(r.created_at) >= startOfMonth).length,
                },
            };
        },
    });
}

interface DeleteReviewInput {
    reviewId: string;
    packageTitle: string;
    travelerName: string;
    rating: number;
}

export function useDeleteReview() {
    const queryClient = useQueryClient();
    const audit = useAdminAudit();

    return useMutation({
        mutationFn: async ({ reviewId }: DeleteReviewInput) => {
            const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
            if (error) throw error;
        },
        onSuccess: (_data, { reviewId, packageTitle, travelerName, rating }) => {
            queryClient.invalidateQueries({ queryKey: adminReviewsKey });
            void audit({
                actionType: 'review_deletion',
                description: `Deleted ${rating}-star review by ${travelerName} on "${packageTitle}"`,
                entityType: 'review',
                entityId: reviewId,
                metadata: { rating },
            });
        },
    });
}
