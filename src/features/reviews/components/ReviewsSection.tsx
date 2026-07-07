
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { formatDate } from "@/lib/formatters";
import { useTranslation } from "react-i18next";

interface ReviewsSectionProps {
    packageId: string;
}

export function ReviewsSection({ packageId }: ReviewsSectionProps) {
    const { user } = useAuth();
    const { reviews, loading, fetchPackageReviews } = useReviews();
    const [canReview, setCanReview] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetchPackageReviews(packageId);
    }, [packageId, fetchPackageReviews]);

    useEffect(() => {
        async function checkEligibility() {
            if (!user) {
                setCanReview(false);
                return;
            }

            // Check for COMPLETED booking that hasn't been reviewed yet
            const { data: bookings } = await supabase
                .from('package_bookings')
                .select('id')
                .eq('package_id', packageId)
                .eq('traveler_id', user.id)
                .eq('status', 'completed');

            if (bookings && bookings.length > 0) {
                // Check if already reviewed
                const { data: existingReview } = await supabase
                    .from('reviews')
                    .select('id')
                    .eq('booking_id', bookings[0].id)
                    .maybeSingle(); // Use maybeSingle to avoid 406 on no rows

                if (!existingReview) {
                    setCanReview(true);
                    setBookingId(bookings[0].id);
                } else {
                    setCanReview(false);
                }
            } else {
                setCanReview(false);
            }
        }

        checkEligibility();
    }, [packageId, user, reviews]); // Re-check when reviews change (after submission)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                    {t('common.reviews')} ({reviews.length})
                </CardTitle>
                {canReview && bookingId && (
                    <ReviewForm
                        packageId={packageId}
                        bookingId={bookingId}
                        onSuccess={() => fetchPackageReviews(packageId)}
                    />
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">{t('common.loading')}</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {t('common.noReviewsYet', 'No reviews yet. Be the first to share your experience!')}
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
                            <div className="flex items-start gap-4">
                                <Avatar>
                                    <AvatarImage src={review.traveler?.avatar_url || undefined} />
                                    <AvatarFallback>
                                        {review.traveler?.first_name?.[0]}
                                        {review.traveler?.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">
                                            {review.traveler?.first_name} {review.traveler?.last_name}
                                        </h4>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(review.created_at, 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <div>
                                        <StarRating rating={review.rating} readonly size="sm" />
                                    </div>
                                    {review.comment && (
                                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
