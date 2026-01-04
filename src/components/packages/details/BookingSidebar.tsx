
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
import { PackageDetails } from "@/hooks/usePackageDetails";
import { BookingModal } from "./BookingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface BookingSidebarProps {
  packageData: PackageDetails;
}

export function BookingSidebar({ packageData }: BookingSidebarProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleBookNow = () => {
    if (!user) {
      navigate('/auth?type=traveler');
      return;
    }

    if (profile?.role !== 'traveler') {
      navigate('/auth?type=traveler');
      return;
    }

    setShowBookingModal(true);
  };

  return (
    <>
      <Card className="sticky top-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader>
          <div className="text-center">
            <div className={`flex items-center justify-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-3xl font-bold text-gray-900">
                ${packageData.base_price}
              </span>
            </div>
            <p className="text-sm text-gray-600">{t('packageDetails.perPerson')} • {packageData.category} {t('tours.tour')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleBookNow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {!user ? t('packageDetails.signInToBook') : t('packageDetails.requestBooking')}
          </Button>
          
          <Separator />
          
          <div>
            <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('packageDetails.packageDetails')}</h4>
            <div className="space-y-2 text-sm">
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{t('packageDetails.duration')}:</span>
                <span>{packageData.duration_days} {t('common.days')}, {packageData.duration_nights} {t('packageDetails.nights')}</span>
              </div>
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{t('packageDetails.maxParticipants')}:</span>
                <span>{packageData.max_participants}</span>
              </div>
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{t('packageDetails.difficulty')}:</span>
                <span className="capitalize">{packageData.difficulty_level || t('packageWizard.moderate')}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-center text-sm text-gray-600">
            <div className={`flex items-center justify-center gap-1 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Shield className="w-4 h-4" />
              <span>{t('packageDetails.secureBooking')}</span>
            </div>
            <p>{t('packageDetails.noPaymentRequired')}</p>
          </div>
        </CardContent>
      </Card>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        packageData={packageData}
      />
    </>
  );
}
