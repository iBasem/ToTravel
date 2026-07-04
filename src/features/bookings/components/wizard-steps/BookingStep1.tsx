
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Textarea } from '@/ui/textarea';
import { Calendar, Users, MapPin } from 'lucide-react';
import { BookingFormData } from '../BookingWizard';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';

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
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                className={`p-4 border rounded-lg transition-colors text-start ${formData.selectedDate === availability.date
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{availability.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {availability.spotsLeft} {t('booking.spotsLeft')}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-medium">{formatCurrency(availability.price)}</div>
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
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('booking.numberOfTravelers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="travelers" className="text-start block">{t('booking.howManyTraveling')}</Label>
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
                <SelectTrigger className="text-start">
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
                <div className="flex items-center justify-between">
                  <div className="text-start">
                    <div className="font-medium">{t('booking.selectedDate')}: {formData.selectedDate}</div>
                    <div className="text-sm text-muted-foreground">{formData.travelers} {formData.travelers === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')}</div>
                  </div>
                  <div className="text-end">
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
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('booking.specialRequests')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="special-requests" className="text-start block">
              {t('booking.specialRequestsOptional')}
            </Label>
            <Textarea
              id="special-requests"
              placeholder={t('booking.specialRequestsPlaceholder')}
              value={formData.specialRequests}
              onChange={(e) => updateFormData({ specialRequests: e.target.value })}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
