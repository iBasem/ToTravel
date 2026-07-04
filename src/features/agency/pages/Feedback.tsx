import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAgencyFeedback } from "@/features/agency/hooks/useAgencyFeedback";
import { formatDate } from "@/lib/formatters";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";

export default function Feedback() {
  const { t } = useTranslation();
  const { feedbacks, stats, loading, error } = useAgencyFeedback();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return t('agencyDashboard.published');
      case "pending":
        return t('agencyDashboard.pending');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">
        {t('agencyDashboard.customerFeedback')}
      </h1>

      {/* Stats Cards - Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 tabular-nums">{stats.averageRating}</div>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-sm text-gray-600 mt-1">{t('agencyDashboard.averageRating')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 tabular-nums">{stats.totalReviews}</div>
              <p className="text-sm text-gray-600">{t('agencyDashboard.totalReviews')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 tabular-nums">{stats.pendingReviews}</div>
              <p className="text-sm text-gray-600">{t('agencyDashboard.pendingReviews')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 tabular-nums">{stats.satisfactionRate}%</div>
              <p className="text-sm text-gray-600">{t('agencyDashboard.satisfactionRate')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <EmptyState
          icon="star"
          title={t('agencyDashboard.noFeedbackYet', { defaultValue: 'No Feedback Yet' })}
          description={t('agencyDashboard.feedbackWillAppear', { defaultValue: 'Customer reviews will appear here after they complete their trips.' })}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('agencyDashboard.recentFeedback')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                    <div>
                      <p className="font-medium">{feedback.travelerName}</p>
                      <p className="text-sm text-gray-600">{feedback.packageTitle}</p>
                    </div>
                    <div className="text-end">
                      <Badge className={getStatusColor(feedback.status)}>
                        {getStatusLabel(feedback.status)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(feedback.date, 'PP')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center mb-2">
                    {renderStars(feedback.rating)}
                    <span className="text-sm text-gray-600 ms-2">({feedback.rating}/5)</span>
                  </div>
                  <p className="text-gray-700">{feedback.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
