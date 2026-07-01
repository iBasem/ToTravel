import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface Review {
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

interface ReviewStats {
    total: number;
    averageRating: number;
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
    thisMonth: number;
}

export function useAdminReviews() {
    const { profile } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>({
        total: 0,
        averageRating: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
        thisMonth: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (isAdmin) {
            fetchReviews();
        }
    }, [isAdmin]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (reviewsError) throw reviewsError;

            // Fetch travelers for names
            const { data: travelersData, error: travelersError } = await supabase
                .from('travelers')
                .select('id, first_name, last_name, email');

            if (travelersError) throw travelersError;

            // Fetch packages for titles
            const { data: packagesData, error: packagesError } = await supabase
                .from('packages')
                .select('id, title, destination, agency_id');

            if (packagesError) throw packagesError;

            // Fetch agencies for names
            const { data: agenciesData, error: agenciesError } = await supabase
                .from('travel_agencies')
                .select('id, company_name');

            if (agenciesError) throw agenciesError;

            // Create maps
            const travelerMap = new Map(travelersData?.map(t => [t.id, t]));
            const packageMap = new Map(packagesData?.map(p => [p.id, p]));
            const agencyMap = new Map(agenciesData?.map(a => [a.id, a.company_name]));

            // Map reviews with related data
            const mappedReviews: Review[] = (reviewsData || []).map(r => {
                const traveler = travelerMap.get(r.traveler_id);
                const pkg = packageMap.get(r.package_id);
                const agencyName = pkg ? agencyMap.get(pkg.agency_id) || 'Unknown' : 'Unknown';

                return {
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    created_at: r.created_at,
                    traveler_name: traveler ? `${traveler.first_name} ${traveler.last_name}` : 'Unknown',
                    traveler_email: traveler?.email || '',
                    package_title: pkg?.title || 'Unknown Package',
                    package_destination: pkg?.destination || 'Unknown',
                    agency_name: agencyName,
                };
            });

            setReviews(mappedReviews);

            // Calculate stats
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const total = mappedReviews.length;
            const avgRating = total > 0
                ? Math.round((mappedReviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
                : 0;

            setStats({
                total,
                averageRating: avgRating,
                fiveStars: mappedReviews.filter(r => r.rating === 5).length,
                fourStars: mappedReviews.filter(r => r.rating === 4).length,
                threeStars: mappedReviews.filter(r => r.rating === 3).length,
                twoStars: mappedReviews.filter(r => r.rating === 2).length,
                oneStar: mappedReviews.filter(r => r.rating === 1).length,
                thisMonth: mappedReviews.filter(r => new Date(r.created_at) >= startOfMonth).length,
            });
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const deleteReview = async (reviewId: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            await fetchReviews();
            return { success: true };
        } catch (err) {
            console.error('Error deleting review:', err);
            return { success: false, error: err };
        }
    };

    return {
        reviews,
        stats,
        loading,
        error,
        refetch: fetchReviews,
        deleteReview,
    };
}
