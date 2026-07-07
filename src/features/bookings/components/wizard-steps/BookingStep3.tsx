
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Label } from '@/ui/label';
import { Checkbox } from '@/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Bed, Utensils, Shield, Car } from 'lucide-react';
import { BookingFormData } from '../BookingWizard';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';

interface BookingStep3Props {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
}

export function BookingStep3({ formData, updateFormData }: BookingStep3Props) {
  const { t } = useTranslation();

  const DIETARY_OPTIONS = [
    { key: 'Vegetarian', label: t('booking.vegetarian') },
    { key: 'Vegan', label: t('booking.vegan') },
    { key: 'Gluten-free', label: t('booking.glutenFree') },
    { key: 'Halal', label: t('booking.halal') },
    { key: 'Kosher', label: t('booking.kosher') },
    { key: 'Nut allergies', label: t('booking.nutAllergies') },
    { key: 'Dairy-free', label: t('booking.dairyFree') },
    { key: 'Other', label: t('booking.other') }
  ];

  const toggleDietaryRestriction = (restriction: string) => {
    const current = formData.dietaryRestrictions;
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];

    updateFormData({ dietaryRestrictions: updated });
  };

  return (
    <div className="space-y-6">
      {/* Room Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="w-5 h-5" />
            {t('booking.roomPreference')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>{t('booking.preferredRoomType')}</Label>
              <Select
                value={formData.roomPreference}
                onValueChange={(value) => updateFormData({ roomPreference: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t('booking.singleRoom')}</SelectItem>
                  <SelectItem value="double">{t('booking.doubleRoom')}</SelectItem>
                  <SelectItem value="twin">{t('booking.twinBeds')}</SelectItem>
                  <SelectItem value="family">{t('booking.familyRoom')}</SelectItem>
                  <SelectItem value="suite">{t('booking.suite')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            {t('booking.dietaryRequirements')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>{t('booking.selectDietaryRestrictions')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DIETARY_OPTIONS.map((option) => (
                <div key={option.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`dietary-${option.key}`}
                    checked={formData.dietaryRestrictions.includes(option.key)}
                    onCheckedChange={() => toggleDietaryRestriction(option.key)}
                  />
                  <Label
                    htmlFor={`dietary-${option.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('booking.travelInsurance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="travel-insurance"
                checked={formData.travelInsurance}
                onCheckedChange={(checked) => updateFormData({ travelInsurance: !!checked })}
              />
              <div className="space-y-1">
                <Label htmlFor="travel-insurance" className="cursor-pointer">
                  {t('booking.insuranceAddon', { price: formatCurrency(49), defaultValue: 'Add comprehensive travel insurance (+{{price}} per person)' })}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('booking.travelInsuranceDesc')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Airport Transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {t('booking.airportTransfer')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="airport-transfer"
                checked={formData.airportTransfer}
                onCheckedChange={(checked) => updateFormData({ airportTransfer: !!checked })}
              />
              <div className="space-y-1">
                <Label htmlFor="airport-transfer" className="cursor-pointer">
                  {t('booking.transferAddon', { price: formatCurrency(35), defaultValue: 'Add round-trip airport transfer (+{{price}} per person)' })}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('booking.airportTransferDesc')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('booking.costSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t('booking.tourPackage')} ({formData.travelers} {formData.travelers === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')})</span>
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
            <hr className="my-2" />
            <div className="flex justify-between font-medium text-lg">
              <span>{t('booking.totalEstimatedCost')}</span>
              <span className="text-primary">
                {formatCurrency(formData.totalAmount +
                  (formData.travelInsurance ? 49 * formData.travelers : 0) +
                  (formData.airportTransfer ? 35 * formData.travelers : 0))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
