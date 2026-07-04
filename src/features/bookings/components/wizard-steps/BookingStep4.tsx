
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Calendar, Users, MapPin, CreditCard, Check } from 'lucide-react';
import { BookingFormData } from '../BookingWizard';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';

interface BookingStep4Props {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
  packageData: {
    id: number;
    title: string;
    price: number;
  };
  onSubmit: () => void;
}

export function BookingStep4({ formData, updateFormData, packageData, onSubmit }: BookingStep4Props) {
  const { t } = useTranslation();

  const totalCost = formData.totalAmount +
    (formData.travelInsurance ? 49 * formData.travelers : 0) +
    (formData.airportTransfer ? 35 * formData.travelers : 0);

  const isFormValid = formData.termsAccepted &&
    formData.leadTraveler.firstName &&
    formData.leadTraveler.lastName &&
    formData.leadTraveler.email &&
    formData.selectedDate;

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            {t('booking.bookingSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium">{packageData.title}</div>
                <div className="text-sm text-gray-600">{t('booking.tourPackage')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium">{formData.selectedDate}</div>
                <div className="text-sm text-gray-600">{t('booking.departureDate')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium">{formData.travelers} {formData.travelers === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')}</div>
                <div className="text-sm text-gray-600">
                  {t('booking.lead')}: {formData.leadTraveler.firstName} {formData.leadTraveler.lastName}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traveler Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('booking.travelerInformation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">
                {formData.leadTraveler.firstName} {formData.leadTraveler.lastName} ({t('booking.lead')})
              </div>
              <div className="text-sm text-gray-600">{formData.leadTraveler.email}</div>
            </div>

            {formData.additionalTravelers.map((traveler, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">
                  {traveler.firstName} {traveler.lastName}
                </div>
                <div className="text-sm text-gray-600">{t('booking.additionalTraveler')}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Services */}
      {(formData.travelInsurance || formData.airportTransfer || formData.dietaryRestrictions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('booking.additionalServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('booking.roomPreference')}:</span>
                <span className="capitalize">{formData.roomPreference}</span>
              </div>

              {formData.dietaryRestrictions.length > 0 && (
                <div className="flex justify-between">
                  <span>{t('booking.dietaryRequirements')}:</span>
                  <span>{formData.dietaryRestrictions.join(', ')}</span>
                </div>
              )}

              {formData.travelInsurance && (
                <div className="flex justify-between">
                  <span>{t('booking.travelInsurance')}:</span>
                  <span>{t('common.added')} (+{formatCurrency(49 * formData.travelers)})</span>
                </div>
              )}

              {formData.airportTransfer && (
                <div className="flex justify-between">
                  <span>{t('booking.airportTransfer')}:</span>
                  <span>{t('common.added')} (+{formatCurrency(35 * formData.travelers)})</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('booking.paymentMethod')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>{t('booking.selectPaymentMethod')}</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => updateFormData({ paymentMethod: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">{t('booking.creditDebitCard')}</SelectItem>
                  <SelectItem value="paypal">{t('booking.paypal')}</SelectItem>
                  <SelectItem value="bank">{t('booking.bankTransfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800 mb-2">
                <strong>{t('booking.paymentNotice')}</strong>
              </div>
              <div className="text-sm text-blue-700">
                {t('booking.paymentNoticeDesc')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('booking.finalCostBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t('booking.tourPackage')} ({formData.travelers} × {formatCurrency(formData.totalAmount / formData.travelers)})</span>
              <span>{formatCurrency(formData.totalAmount)}</span>
            </div>

            {formData.travelInsurance && (
              <div className="flex justify-between text-sm">
                <span>{t('booking.travelInsurance')} ({formData.travelers} × {formatCurrency(49)})</span>
                <span>+{formatCurrency(49 * formData.travelers)}</span>
              </div>
            )}

            {formData.airportTransfer && (
              <div className="flex justify-between text-sm">
                <span>{t('booking.airportTransfer')} ({formData.travelers} × {formatCurrency(35)})</span>
                <span>+{formatCurrency(35 * formData.travelers)}</span>
              </div>
            )}

            <hr className="my-3" />

            <div className="flex justify-between font-bold text-lg">
              <span>{t('booking.totalAmount')}</span>
              <span className="text-blue-600">{formatCurrency(totalCost)}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('booking.depositRequired')}</span>
              <span>{formatCurrency(Math.round(totalCost * 0.25))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => updateFormData({ termsAccepted: !!checked })}
              />
              <div className="space-y-1">
                <Label htmlFor="terms" className="cursor-pointer text-sm">
                  {t('booking.agreeToTerms')}
                </Label>
                <p className="text-xs text-gray-500">
                  {t('booking.agreeToTermsDesc')}
                </p>
              </div>
            </div>

            <Button
              onClick={onSubmit}
              disabled={!isFormValid}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {t('booking.submitBookingRequest')}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              {t('booking.bookingRequestNote')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
