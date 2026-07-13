import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
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
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground/30'
          }`}
      />
    ));
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
        <p className="text-destructive">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">
        {t('agencyDashboard.customerFeedback')}
      </h1>

      {/* Stats Cards — same label/value pattern as the agency overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.averageRating')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.averageRating}</div>
            <div className="flex mt-1">{renderStars(Math.round(stats.averageRating))}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.totalReviews')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.recentReviews30', 'New in last 30 days')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.recentReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('agencyDashboard.satisfactionRate')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.satisfactionRate}%</div>
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
                      <p className="text-sm text-muted-foreground">{feedback.packageTitle}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(feedback.date, 'PP')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center mb-2">
                    {renderStars(feedback.rating)}
                    <span className="text-sm text-muted-foreground ms-2">({feedback.rating}/5)</span>
                  </div>
                  <p dir="auto" className="text-foreground text-start">{feedback.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
