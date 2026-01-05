
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Plus, Trash2 } from 'lucide-react';
import { BookingFormData } from '../BookingWizard';
import { useTranslation } from 'react-i18next';

interface BookingStep2Props {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
}

export function BookingStep2({ formData, updateFormData }: BookingStep2Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Lead Traveler */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <User className="w-5 h-5" />
            {t('booking.leadTravelerInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead-first-name" className={isRTL ? 'text-right block' : 'text-left block'}>{t('auth.firstName')} *</Label>
              <Input
                id="lead-first-name"
                value={formData.leadTraveler.firstName}
                onChange={(e) => updateLeadTraveler('firstName', e.target.value)}
                placeholder={t('booking.enterFirstName')}
                className={isRTL ? 'text-right' : 'text-left'}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-last-name" className={isRTL ? 'text-right block' : 'text-left block'}>{t('auth.lastName')} *</Label>
              <Input
                id="lead-last-name"
                value={formData.leadTraveler.lastName}
                onChange={(e) => updateLeadTraveler('lastName', e.target.value)}
                placeholder={t('booking.enterLastName')}
                className={isRTL ? 'text-right' : 'text-left'}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email" className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.emailAddress')} *</Label>
              <Input
                id="lead-email"
                type="email"
                value={formData.leadTraveler.email}
                onChange={(e) => updateLeadTraveler('email', e.target.value)}
                placeholder={t('booking.enterEmail')}
                className={isRTL ? 'text-right' : 'text-left'}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone" className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.phoneNumber')} *</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={formData.leadTraveler.phone}
                onChange={(e) => updateLeadTraveler('phone', e.target.value)}
                placeholder={t('booking.enterPhone')}
                className={isRTL ? 'text-right' : 'text-left'}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-dob" className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.dateOfBirth')} *</Label>
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
              <Label htmlFor="lead-nationality" className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.nationality')} *</Label>
              <Input
                id="lead-nationality"
                value={formData.leadTraveler.nationality}
                onChange={(e) => updateLeadTraveler('nationality', e.target.value)}
                placeholder={t('booking.enterNationality')}
                className={isRTL ? 'text-right' : 'text-left'}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="lead-passport" className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.passportNumber')} *</Label>
              <Input
                id="lead-passport"
                value={formData.leadTraveler.passportNumber}
                onChange={(e) => updateLeadTraveler('passportNumber', e.target.value)}
                placeholder={t('booking.enterPassport')}
                className={isRTL ? 'text-right' : 'text-left'}
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
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-5 h-5" />
                {t('booking.additionalTravelers')} ({currentTravelers - 1} / {totalTravelersNeeded - 1})
              </CardTitle>
              {currentTravelers < totalTravelersNeeded && (
                <Button onClick={addAdditionalTraveler} size="sm" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h4 className="font-medium">{t('booking.travelerSingular')} {index + 2}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdditionalTraveler(index)}
                        className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('common.remove')}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('auth.firstName')} *</Label>
                        <Input
                          value={traveler.firstName}
                          onChange={(e) => updateAdditionalTraveler(index, 'firstName', e.target.value)}
                          placeholder={t('booking.enterFirstName')}
                          className={isRTL ? 'text-right' : 'text-left'}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('auth.lastName')} *</Label>
                        <Input
                          value={traveler.lastName}
                          onChange={(e) => updateAdditionalTraveler(index, 'lastName', e.target.value)}
                          placeholder={t('booking.enterLastName')}
                          className={isRTL ? 'text-right' : 'text-left'}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.dateOfBirth')} *</Label>
                        <Input
                          type="date"
                          value={traveler.dateOfBirth}
                          onChange={(e) => updateAdditionalTraveler(index, 'dateOfBirth', e.target.value)}
                          dir="ltr"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.nationality')} *</Label>
                        <Input
                          value={traveler.nationality}
                          onChange={(e) => updateAdditionalTraveler(index, 'nationality', e.target.value)}
                          placeholder={t('booking.enterNationality')}
                          className={isRTL ? 'text-right' : 'text-left'}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          required
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('booking.passportNumber')} *</Label>
                        <Input
                          value={traveler.passportNumber}
                          onChange={(e) => updateAdditionalTraveler(index, 'passportNumber', e.target.value)}
                          placeholder={t('booking.enterPassport')}
                          className={isRTL ? 'text-right' : 'text-left'}
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
