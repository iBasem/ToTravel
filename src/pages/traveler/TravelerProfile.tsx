
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Bell,
  Shield,
  CreditCard,
  Camera
} from "lucide-react";

export default function TravelerProfile() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "1990-05-15",
    nationality: "United States",
    address: "123 Main St, New York, NY 10001",
    bio: "Travel enthusiast who loves exploring new cultures and cuisines.",
    emergencyContact: {
      name: "Jane Doe",
      phone: "+1 (555) 987-6543",
      relationship: "Spouse"
    }
  });

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailPromotions: false,
    smsReminders: true,
    pushNotifications: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showTravelHistory: false,
    allowMessages: true
  });

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h1 className={`text-2xl font-bold ${isRTL ? 'text-right' : ''}`}>{t('travelerDashboard.myProfile')}</h1>
        <Button>{t('travelerDashboard.saveChanges')}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-2xl">JD</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className={`absolute -bottom-2 rounded-full ${isRTL ? '-left-2' : '-right-2'}`}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle>{profileData.firstName} {profileData.lastName}</CardTitle>
            <p className="text-gray-600">{profileData.email}</p>
            <div className={`flex justify-center gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Badge variant="secondary">{t('travelerDashboard.verifiedTraveler')}</Badge>
              <Badge variant="outline">12 {t('travelerDashboard.countriesVisited')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex items-center gap-3 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4" />
                <span>{profileData.nationality}</span>
              </div>
              <div className={`flex items-center gap-3 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-4 h-4" />
                <span>{t('travelerDashboard.memberSince')} 2023</span>
              </div>
              <div className={`flex items-center gap-3 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-4 h-4" />
                <span>5 {t('travelerDashboard.completedTours')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-5 h-5" />
                {t('travelerDashboard.personalInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className={isRTL ? 'text-right block' : ''}>{t('auth.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                    className={isRTL ? 'text-right' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className={isRTL ? 'text-right block' : ''}>{t('auth.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                    className={isRTL ? 'text-right' : ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className={isRTL ? 'text-right block' : ''}>{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileUpdate('email', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className={isRTL ? 'text-right block' : ''}>{t('travelerDashboard.phone')}</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className={isRTL ? 'text-right block' : ''}>{t('booking.dateOfBirth')}</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => handleProfileUpdate('dateOfBirth', e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality" className={isRTL ? 'text-right block' : ''}>{t('booking.nationality')}</Label>
                  <Input
                    id="nationality"
                    value={profileData.nationality}
                    onChange={(e) => handleProfileUpdate('nationality', e.target.value)}
                    className={isRTL ? 'text-right' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="address" className={isRTL ? 'text-right block' : ''}>{t('travelerDashboard.address')}</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => handleProfileUpdate('address', e.target.value)}
                    className={isRTL ? 'text-right' : ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio" className={isRTL ? 'text-right block' : ''}>{t('travelerDashboard.bio')}</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                  rows={3}
                  className={isRTL ? 'text-right' : ''}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone className="w-5 h-5" />
                {t('travelerDashboard.emergencyContact')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyName" className={isRTL ? 'text-right block' : ''}>{t('travelerDashboard.name')}</Label>
                  <Input
                    id="emergencyName"
                    value={profileData.emergencyContact.name}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                    className={isRTL ? 'text-right' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone" className={isRTL ? 'text-right block' : ''}>{t('travelerDashboard.phone')}</Label>
                  <Input
                    id="emergencyPhone"
                    value={profileData.emergencyContact.phone}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emergencyRelationship" className={isRTL ? 'text-right block' : ''}>{t('travelerDashboard.relationship')}</Label>
                <Input
                  id="emergencyRelationship"
                  value={profileData.emergencyContact.relationship}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                  className={isRTL ? 'text-right' : ''}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Bell className="w-5 h-5" />
                {t('travelerDashboard.notificationPreferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <Label htmlFor="emailBookings">{t('travelerDashboard.emailForBookings')}</Label>
                  <p className="text-sm text-gray-600">{t('travelerDashboard.emailForBookingsDesc')}</p>
                </div>
                <Switch
                  id="emailBookings"
                  checked={notifications.emailBookings}
                  onCheckedChange={(checked) => handleNotificationChange('emailBookings', checked)}
                />
              </div>
              <Separator />
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <Label htmlFor="emailPromotions">{t('travelerDashboard.emailPromotions')}</Label>
                  <p className="text-sm text-gray-600">{t('travelerDashboard.emailPromotionsDesc')}</p>
                </div>
                <Switch
                  id="emailPromotions"
                  checked={notifications.emailPromotions}
                  onCheckedChange={(checked) => handleNotificationChange('emailPromotions', checked)}
                />
              </div>
              <Separator />
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <Label htmlFor="smsReminders">{t('travelerDashboard.smsReminders')}</Label>
                  <p className="text-sm text-gray-600">{t('travelerDashboard.smsRemindersDesc')}</p>
                </div>
                <Switch
                  id="smsReminders"
                  checked={notifications.smsReminders}
                  onCheckedChange={(checked) => handleNotificationChange('smsReminders', checked)}
                />
              </div>
              <Separator />
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <Label htmlFor="pushNotifications">{t('travelerDashboard.pushNotifications')}</Label>
                  <p className="text-sm text-gray-600">{t('travelerDashboard.pushNotificationsDesc')}</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Shield className="w-5 h-5" />
                {t('travelerDashboard.privacySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <Label htmlFor="profileVisible">{t('travelerDashboard.publicProfile')}</Label>
                  <p className="text-sm text-gray-600">{t('travelerDashboard.publicProfileDesc')}</p>
                </div>
                <Switch
                  id="profileVisible"
                  checked={privacy.profileVisible}
                  onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                />
              </div>
              <Separator />
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <Label htmlFor="showTravelHistory">{t('travelerDashboard.showTravelHistory')}</Label>
                  <p className="text-sm text-gray-600">{t('travelerDashboard.showTravelHistoryDesc')}</p>
                </div>
                <Switch
                  id="showTravelHistory"
                  checked={privacy.showTravelHistory}
                  onCheckedChange={(checked) => handlePrivacyChange('showTravelHistory', checked)}
                />
              </div>
              <Separator />
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <Label htmlFor="allowMessages">{t('travelerDashboard.allowMessages')}</Label>
                  <p className="text-sm text-gray-600">{t('travelerDashboard.allowMessagesDesc')}</p>
                </div>
                <Switch
                  id="allowMessages"
                  checked={privacy.allowMessages}
                  onCheckedChange={(checked) => handlePrivacyChange('allowMessages', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
