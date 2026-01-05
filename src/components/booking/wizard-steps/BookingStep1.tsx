
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, MapPin } from 'lucide-react';
import { BookingFormData } from '../BookingWizard';
import { useTranslation } from 'react-i18next';

interface BookingStep1Props {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
  packageData: {
    id: number;
    title: string;
    price: number;
    availabilities: Array<{
      date: string;
      price: number;
      spotsLeft: number;
    }>;
  };
}

export function BookingStep1({ formData, updateFormData, packageData }: BookingStep1Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Calendar className="w-5 h-5" />
            {t('booking.selectTravelDate')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packageData.availabilities.map((availability, index) => (
              <button
                key={index}
                onClick={() => updateFormData({ 
                  selectedDate: availability.date,
                  totalAmount: availability.price * formData.travelers
                })}
                className={`p-4 border rounded-lg transition-colors ${
                  formData.selectedDate === availability.date
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <div className="font-medium">{availability.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {availability.spotsLeft} {t('booking.spotsLeft')}
                    </div>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <div className="font-medium">${availability.price}</div>
                    <div className="text-sm text-muted-foreground">{t('common.perPerson')}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Users className="w-5 h-5" />
            {t('booking.numberOfTravelers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="travelers" className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.howManyTraveling')}</Label>
              <Select
                value={formData.travelers.toString()}
                onValueChange={(value) => {
                  const travelers = parseInt(value);
                  const selectedAvailability = packageData.availabilities.find(
                    a => a.date === formData.selectedDate
                  );
                  const pricePerPerson = selectedAvailability?.price || packageData.price;
                  
                  updateFormData({ 
                    travelers,
                    totalAmount: pricePerPerson * travelers
                  });
                }}
              >
                <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                  <SelectValue placeholder={t('booking.selectNumberTravelers')} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.selectedDate && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="font-medium">{t('booking.selectedDate')}: {formData.selectedDate}</div>
                    <div className="text-sm text-muted-foreground">{formData.travelers} {formData.travelers === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')}</div>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <div className="text-2xl font-bold text-primary">
                      ${formData.totalAmount}
                    </div>
                    <div className="text-sm text-muted-foreground">{t('booking.totalEstimatedCost')}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MapPin className="w-5 h-5" />
            {t('booking.specialRequests')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="special-requests" className={isRTL ? 'text-right block' : 'text-left block'}>
              {t('booking.specialRequestsOptional')}
            </Label>
            <Textarea
              id="special-requests"
              placeholder={t('booking.specialRequestsPlaceholder')}
              value={formData.specialRequests}
              onChange={(e) => updateFormData({ specialRequests: e.target.value })}
              className={`mt-2 ${isRTL ? 'text-right' : 'text-left'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
