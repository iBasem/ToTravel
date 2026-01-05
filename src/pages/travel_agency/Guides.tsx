
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, MapPin, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Guides() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const guides = [
    {
      id: 1,
      name: "Marie Dubois",
      location: "Paris, France",
      rating: 4.9,
      reviews: 127,
      languages: ["French", "English", "Spanish"],
      specialties: ["Historical Tours", "Art & Culture"]
    },
    {
      id: 2,
      name: "Hiroshi Tanaka",
      location: "Tokyo, Japan",
      rating: 4.8,
      reviews: 89,
      languages: ["Japanese", "English"],
      specialties: ["City Tours", "Food Experience"]
    },
    {
      id: 3,
      name: "Kadek Sari",
      location: "Bali, Indonesia",
      rating: 4.9,
      reviews: 156,
      languages: ["Indonesian", "English"],
      specialties: ["Nature Tours", "Cultural Experience"]
    }
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h1 className={`text-2xl sm:text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>
          {t('agencyDashboard.tourGuides')}
        </h1>
        <Button className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <UserPlus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('agencyDashboard.addGuide')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide) => (
          <Card key={guide.id}>
            <CardHeader>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium text-lg">
                    {guide.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <CardTitle className="text-lg">{guide.name}</CardTitle>
                  <p className={`text-sm text-gray-600 flex items-center gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <MapPin className="w-4 h-4" />
                    {guide.location}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-medium tabular-nums">{guide.rating}</span>
                  <span className="text-sm text-gray-600">({guide.reviews} {t('agencyDashboard.reviews')})</span>
                </div>
                
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium mb-1">{t('agencyDashboard.languages')}:</p>
                  <p className="text-sm text-gray-600">{guide.languages.join(", ")}</p>
                </div>
                
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium mb-1">{t('agencyDashboard.specialties')}:</p>
                  <div className={`flex flex-wrap gap-1 ${isRTL ? 'justify-end' : ''}`}>
                    {guide.specialties.map((specialty) => (
                      <span key={specialty} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
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
