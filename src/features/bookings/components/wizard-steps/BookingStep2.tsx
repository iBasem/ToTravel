
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Button } from '@/ui/button';
import { User, Plus, Trash2 } from 'lucide-react';
import { BookingFormData } from '../BookingWizard';
import { useTranslation } from 'react-i18next';

interface BookingStep2Props {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
}

export function BookingStep2({ formData, updateFormData }: BookingStep2Props) {
  const { t } = useTranslation();

  const updateLeadTraveler = (field: string, value: string) => {
    updateFormData({
      leadTraveler: {
        ...formData.leadTraveler,
        [field]: value,
      },
    });
  };

  const addAdditionalTraveler = () => {
    const newTraveler = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      passportNumber: '',
    };

    updateFormData({
      additionalTravelers: [...formData.additionalTravelers, newTraveler],
    });
  };

  const updateAdditionalTraveler = (index: number, field: string, value: string) => {
    const updatedTravelers = [...formData.additionalTravelers];
    updatedTravelers[index] = {
      ...updatedTravelers[index],
      [field]: value,
    };

    updateFormData({
      additionalTravelers: updatedTravelers,
    });
  };

  const removeAdditionalTraveler = (index: number) => {
    const updatedTravelers = formData.additionalTravelers.filter((_, i) => i !== index);
    updateFormData({
      additionalTravelers: updatedTravelers,
    });
  };

  const totalTravelersNeeded = formData.travelers;
  const currentTravelers = 1 + formData.additionalTravelers.length;

  return (
    <div className="space-y-6">
      {/* Lead Traveler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('booking.leadTravelerInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead-first-name" className="text-start block">{t('auth.firstName')} *</Label>
              <Input
                id="lead-first-name"
                value={formData.leadTraveler.firstName}
                onChange={(e) => updateLeadTraveler('firstName', e.target.value)}
                placeholder={t('booking.enterFirstName')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-last-name" className="text-start block">{t('auth.lastName')} *</Label>
              <Input
                id="lead-last-name"
                value={formData.leadTraveler.lastName}
                onChange={(e) => updateLeadTraveler('lastName', e.target.value)}
                placeholder={t('booking.enterLastName')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email" className="text-start block">{t('booking.emailAddress')} *</Label>
              <Input
                id="lead-email"
                type="email"
                value={formData.leadTraveler.email}
                onChange={(e) => updateLeadTraveler('email', e.target.value)}
                placeholder={t('booking.enterEmail')}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone" className="text-start block">{t('booking.phoneNumber')} *</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={formData.leadTraveler.phone}
                onChange={(e) => updateLeadTraveler('phone', e.target.value)}
                placeholder={t('booking.enterPhone')}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-dob" className="text-start block">{t('booking.dateOfBirth')} *</Label>
              <Input
                id="lead-dob"
                type="date"
                value={formData.leadTraveler.dateOfBirth}
                onChange={(e) => updateLeadTraveler('dateOfBirth', e.target.value)}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-nationality" className="text-start block">{t('booking.nationality')} *</Label>
              <Input
                id="lead-nationality"
                value={formData.leadTraveler.nationality}
                onChange={(e) => updateLeadTraveler('nationality', e.target.value)}
                placeholder={t('booking.enterNationality')}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="lead-passport" className="text-start block">{t('booking.passportNumber')} *</Label>
              <Input
                id="lead-passport"
                value={formData.leadTraveler.passportNumber}
                onChange={(e) => updateLeadTraveler('passportNumber', e.target.value)}
                placeholder={t('booking.enterPassport')}
                dir="ltr"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Travelers */}
      {totalTravelersNeeded > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('booking.additionalTravelers')} ({currentTravelers - 1} / {totalTravelersNeeded - 1})
              </CardTitle>
              {currentTravelers < totalTravelersNeeded && (
                <Button onClick={addAdditionalTraveler} size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t('booking.addTraveler')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {formData.additionalTravelers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('booking.clickAddTraveler')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.additionalTravelers.map((traveler, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{t('booking.travelerSingular')} {index + 2}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdditionalTraveler(index)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('common.remove')}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-start block">{t('auth.firstName')} *</Label>
                        <Input
                          value={traveler.firstName}
                          onChange={(e) => updateAdditionalTraveler(index, 'firstName', e.target.value)}
                          placeholder={t('booking.enterFirstName')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-start block">{t('auth.lastName')} *</Label>
                        <Input
                          value={traveler.lastName}
                          onChange={(e) => updateAdditionalTraveler(index, 'lastName', e.target.value)}
                          placeholder={t('booking.enterLastName')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-start block">{t('booking.dateOfBirth')} *</Label>
                        <Input
                          type="date"
                          value={traveler.dateOfBirth}
                          onChange={(e) => updateAdditionalTraveler(index, 'dateOfBirth', e.target.value)}
                          dir="ltr"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-start block">{t('booking.nationality')} *</Label>
                        <Input
                          value={traveler.nationality}
                          onChange={(e) => updateAdditionalTraveler(index, 'nationality', e.target.value)}
                          placeholder={t('booking.enterNationality')}
                          required
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-start block">{t('booking.passportNumber')} *</Label>
                        <Input
                          value={traveler.passportNumber}
                          onChange={(e) => updateAdditionalTraveler(index, 'passportNumber', e.target.value)}
                          placeholder={t('booking.enterPassport')}
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
