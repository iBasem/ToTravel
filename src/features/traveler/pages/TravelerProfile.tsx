
import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Switch } from "@/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";
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
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    bio: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    }
  });

  // Populate from the signed-in profile once it loads.
  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      firstName: profile?.first_name ?? prev.firstName,
      lastName: profile?.last_name ?? prev.lastName,
      email: profile?.email ?? user?.email ?? prev.email,
    }));
  }, [profile, user]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold">{t('travelerDashboard.myProfile')}</h1>
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
                className="absolute -bottom-2 -end-2 rounded-full"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle>{profileData.firstName} {profileData.lastName}</CardTitle>
            <p className="text-muted-foreground">{profileData.email}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="secondary">{t('travelerDashboard.verifiedTraveler')}</Badge>
              <Badge variant="outline">12 {t('travelerDashboard.countriesVisited')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{profileData.nationality}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{t('travelerDashboard.memberSince')} 2023</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('travelerDashboard.personalInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">{t('auth.email')}</Label>
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
                  <Label htmlFor="phone">{t('travelerDashboard.phone')}</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">{t('booking.dateOfBirth')}</Label>
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
                  <Label htmlFor="nationality">{t('booking.nationality')}</Label>
                  <Input
                    id="nationality"
                    value={profileData.nationality}
                    onChange={(e) => handleProfileUpdate('nationality', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="address">{t('travelerDashboard.address')}</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => handleProfileUpdate('address', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">{t('travelerDashboard.bio')}</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {t('travelerDashboard.emergencyContact')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyName">{t('travelerDashboard.name')}</Label>
                  <Input
                    id="emergencyName"
                    value={profileData.emergencyContact.name}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">{t('travelerDashboard.phone')}</Label>
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
                <Label htmlFor="emergencyRelationship">{t('travelerDashboard.relationship')}</Label>
                <Input
                  id="emergencyRelationship"
                  value={profileData.emergencyContact.relationship}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t('travelerDashboard.notificationPreferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailBookings">{t('travelerDashboard.emailForBookings')}</Label>
                  <p className="text-sm text-muted-foreground">{t('travelerDashboard.emailForBookingsDesc')}</p>
                </div>
                <Switch
                  id="emailBookings"
                  checked={notifications.emailBookings}
                  onCheckedChange={(checked) => handleNotificationChange('emailBookings', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailPromotions">{t('travelerDashboard.emailPromotions')}</Label>
                  <p className="text-sm text-muted-foreground">{t('travelerDashboard.emailPromotionsDesc')}</p>
                </div>
                <Switch
                  id="emailPromotions"
                  checked={notifications.emailPromotions}
                  onCheckedChange={(checked) => handleNotificationChange('emailPromotions', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsReminders">{t('travelerDashboard.smsReminders')}</Label>
                  <p className="text-sm text-muted-foreground">{t('travelerDashboard.smsRemindersDesc')}</p>
                </div>
                <Switch
                  id="smsReminders"
                  checked={notifications.smsReminders}
                  onCheckedChange={(checked) => handleNotificationChange('smsReminders', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">{t('travelerDashboard.pushNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('travelerDashboard.pushNotificationsDesc')}</p>
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
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t('travelerDashboard.privacySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profileVisible">{t('travelerDashboard.publicProfile')}</Label>
                  <p className="text-sm text-muted-foreground">{t('travelerDashboard.publicProfileDesc')}</p>
                </div>
                <Switch
                  id="profileVisible"
                  checked={privacy.profileVisible}
                  onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showTravelHistory">{t('travelerDashboard.showTravelHistory')}</Label>
                  <p className="text-sm text-muted-foreground">{t('travelerDashboard.showTravelHistoryDesc')}</p>
                </div>
                <Switch
                  id="showTravelHistory"
                  checked={privacy.showTravelHistory}
                  onCheckedChange={(checked) => handlePrivacyChange('showTravelHistory', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowMessages">{t('travelerDashboard.allowMessages')}</Label>
                  <p className="text-sm text-muted-foreground">{t('travelerDashboard.allowMessagesDesc')}</p>
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
