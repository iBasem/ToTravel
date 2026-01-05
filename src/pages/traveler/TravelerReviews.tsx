
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { 
  Star, 
  MapPin, 
  Calendar,
  Edit,
  Trash2,
  Plus
} from "lucide-react";

const reviews = [
  {
    id: 1,
    tourTitle: "Costa Rica Quest",
    destination: "Costa Rica",
    rating: 5,
    date: "2024-01-25",
    title: "Amazing Adventure!",
    content: "This tour exceeded all my expectations. The guides were knowledgeable, the accommodations were comfortable, and the wildlife we saw was incredible. The zip-lining experience was a highlight!",
    helpful: 12,
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    tourTitle: "Thailand Island Explorer",
    destination: "Thailand",
    rating: 4,
    date: "2023-12-10",
    title: "Beautiful beaches and culture",
    content: "Great tour with stunning beaches and rich cultural experiences. The food was amazing and our guide was very friendly. Only minor issue was the tight schedule on some days.",
    helpful: 8,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    tourTitle: "European Classic Journey",
    destination: "Europe",
    rating: 5,
    date: "2023-11-15",
    title: "Perfect introduction to Europe",
    content: "As a first-time visitor to Europe, this tour was perfect. We covered all the major highlights and the pace was just right. The local guides in each city were fantastic.",
    helpful: 15,
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop"
  }
];

const pendingReviews = [
  {
    id: 4,
    tourTitle: "Best Of Vietnam in 14 Days",
    destination: "Vietnam",
    completedDate: "2024-03-20",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop"
  }
];

export default function TravelerReviews() {
  const [activeReviews, setActiveReviews] = useState(reviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const startReview = (tour: any) => {
    setSelectedTour(tour);
    setShowReviewForm(true);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-2xl font-bold text-gray-900">{t('travelerDashboard.myReviews')}</h1>
        <p className="text-gray-600">{t('travelerDashboard.shareExperiences')}</p>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Plus className="w-5 h-5" />
              {t('travelerDashboard.writeAReview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.map((tour) => (
              <div key={tour.id} className={`flex items-center gap-4 p-4 bg-blue-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                <img 
                  src={tour.image} 
                  alt={tour.tourTitle}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <h4 className="font-medium">{tour.tourTitle}</h4>
                  <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <MapPin className="w-4 h-4" />
                    {tour.destination}
                    <span>•</span>
                    <Calendar className="w-4 h-4" />
                    {t('travelerDashboard.completed')} {new Date(tour.completedDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
                <Button onClick={() => startReview(tour)}>
                  {t('travelerDashboard.writeReview')}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {showReviewForm && selectedTour && (
        <Card>
          <CardHeader>
            <CardTitle className={isRTL ? 'text-right' : ''}>{t('travelerDashboard.writeReview')} - {selectedTour.tourTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t('travelerDashboard.rating')}</label>
              <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-6 h-6 text-gray-300 hover:text-yellow-500 cursor-pointer" />
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t('travelerDashboard.reviewTitle')}</label>
              <input 
                type="text" 
                className={`w-full p-2 border border-gray-300 rounded-lg ${isRTL ? 'text-right' : ''}`}
                placeholder={t('travelerDashboard.giveReviewTitle')}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t('travelerDashboard.yourReview')}</label>
              <Textarea 
                className={`min-h-32 ${isRTL ? 'text-right' : ''}`}
                placeholder={t('travelerDashboard.shareExperience')}
              />
            </div>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <Button>{t('travelerDashboard.submitReview')}</Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Published Reviews */}
      <div className="space-y-4">
        <h2 className={`text-xl font-semibold ${isRTL ? 'text-right' : ''}`}>{t('travelerDashboard.publishedReviews')}</h2>
        {activeReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <img 
                  src={review.image} 
                  alt={review.tourTitle}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className={`flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <h3 className="font-semibold text-lg">{review.title}</h3>
                      <p className="text-gray-600">{review.tourTitle}</p>
                      <div className={`flex items-center gap-2 text-sm text-gray-500 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                        <MapPin className="w-4 h-4" />
                        {review.destination}
                        <span>•</span>
                        <Calendar className="w-4 h-4" />
                        {new Date(review.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium tabular-nums">{review.rating}/5</span>
                  </div>
                  
                  <p className={`text-gray-700 mb-3 ${isRTL ? 'text-right' : ''}`}>{review.content}</p>
                  
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Badge variant="outline">
                      {review.helpful} {t('travelerDashboard.peopleFoundHelpful')}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {t('travelerDashboard.reviewedOn')} {new Date(review.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
