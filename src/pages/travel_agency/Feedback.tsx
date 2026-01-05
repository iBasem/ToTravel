
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Feedback() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const feedbacks = [
    {
      id: 1,
      traveler: "John Smith",
      package: "Romantic Paris Getaway",
      rating: 5,
      comment: "Absolutely wonderful experience! Everything was perfectly organized.",
      date: "2024-03-20",
      status: "published"
    },
    {
      id: 2,
      traveler: "Sarah Johnson",
      package: "Tokyo Adventure",
      rating: 4,
      comment: "Great trip overall, but the hotel could have been better.",
      date: "2024-04-15",
      status: "published"
    },
    {
      id: 3,
      traveler: "Mike Wilson",
      package: "Bali Relaxation",
      rating: 5,
      comment: "Perfect vacation! The guide was amazing and very knowledgeable.",
      date: "2024-05-10",
      status: "pending"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className={`text-2xl sm:text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>
        {t('agencyDashboard.customerFeedback')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 tabular-nums">4.8</div>
              <div className={`flex justify-center mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {renderStars(5)}
              </div>
              <p className="text-sm text-gray-600 mt-1">{t('agencyDashboard.averageRating')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 tabular-nums">127</div>
              <p className="text-sm text-gray-600">{t('agencyDashboard.totalReviews')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 tabular-nums">3</div>
              <p className="text-sm text-gray-600">{t('agencyDashboard.pendingReviews')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 tabular-nums">95%</div>
              <p className="text-sm text-gray-600">{t('agencyDashboard.satisfactionRate')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MessageSquare className="w-5 h-5" />
            {t('agencyDashboard.recentFeedback')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="border-b pb-6 last:border-b-0">
                <div className={`flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-medium">{feedback.traveler}</p>
                    <p className="text-sm text-gray-600">{feedback.package}</p>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <Badge className={getStatusColor(feedback.status)}>
                      {getStatusLabel(feedback.status)}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{feedback.date}</p>
                  </div>
                </div>
                <div className={`flex items-center mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  {renderStars(feedback.rating)}
                  <span className={`text-sm text-gray-600 ${isRTL ? 'mr-2' : 'ml-2'}`}>({feedback.rating}/5)</span>
                </div>
                <p className={`text-gray-700 ${isRTL ? 'text-right' : ''}`}>{feedback.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
