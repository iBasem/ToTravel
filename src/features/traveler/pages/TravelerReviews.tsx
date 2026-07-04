
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/button";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/ui/empty-state";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { Card, CardContent } from "@/ui/card";
import { StarRating } from "@/features/reviews/components/StarRating";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { formatDate } from "@/lib/formatters";

export default function TravelerReviews() {
  const { t } = useTranslation();
  const { fetchTravelerReviews } = useReviews();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      const data = await fetchTravelerReviews();
      setReviews(data || []);
      setLoading(false);
    };
    loadReviews();
  }, [fetchTravelerReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('travelerDashboard.myReviews')}</h1>
        <p className="text-gray-600">{t('travelerDashboard.shareExperiences')}</p>
      </div>

      <div className="grid gap-6">
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const primaryImage = review.package.package_media?.find((m: any) => m.is_primary) || review.package.package_media?.[0];
            const imageUrl = primaryImage?.file_path || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&h=100&fit=crop";

            return (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4 sm:gap-6">
                    <img
                      src={imageUrl}
                      alt={review.package.title}
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg hover:underline">
                          <Link to={`/packages/${review.package.id}`}>{review.package.title}</Link>
                        </h3>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(review.created_at, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <StarRating rating={review.rating} readonly size="sm" />
                      <p className="text-gray-600 text-sm sm:text-base">{review.comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon="star"
            title={t('travelerDashboard.noReviewsTitle') || "No Reviews Yet"}
            description={t('travelerDashboard.noReviewsDesc') || "You haven't written any reviews yet. Complete a booking to leave a review!"}
            action={{
              label: t('travelerDashboard.viewBookings') || "View My Bookings",
              onClick: () => window.location.href = "/dashboard/bookings"
            }}
          />
        )}
      </div>
    </div>
  );
}
