import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Separator } from "@/ui/separator";
import { Skeleton } from "@/ui/skeleton";
import { Badge } from "@/ui/badge";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { Save, Users, Shield } from "lucide-react";
import { getPlatformCurrency } from "@/lib/formatters";

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
}

interface PlatformSettings {
  commission_rate: number;
  currency: string;
  auto_approve: boolean;
  email_notifications: boolean;
  maintenance_mode: boolean;
}

interface EmailTemplate {
  id: string;
  title: string;
  content: string | null;
}

export default function AdminSettings() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    commission_rate: 12,
    currency: getPlatformCurrency(),
    auto_approve: false,
    email_notifications: true,
    maintenance_mode: false,
  });

  // Load admin users and defaults on mount
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch admin users via the profiles view (role = admin)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');

      if (profilesError) throw profilesError;

      const admins: AdminUser[] = (profilesData || []).map(p => ({
        id: p.id,
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        email: p.email || '',
        avatar_url: p.avatar_url,
      }));

      setAdminUsers(admins);

      // Load the persisted platform settings row
      const { data: settingsRow, error: settingsError } = await supabase
        .from('platform_settings')
        .select('*')
        .maybeSingle();

      if (settingsError) throw settingsError;
      if (settingsRow) {
        setSettings(prev => ({
          ...prev,
          commission_rate: Math.round(Number(settingsRow.commission_rate) * 100),
          auto_approve: settingsRow.auto_approve_agencies,
          email_notifications: settingsRow.email_notifications,
          maintenance_mode: settingsRow.maintenance_mode,
        }));
      }

      // Load email templates from the content catalog
      const { data: templatesData, error: templatesError } = await supabase
        .from('content_pages')
        .select('id, title, content')
        .eq('content_type', 'email_template')
        .order('created_at', { ascending: true });

      if (templatesError) throw templatesError;
      setEmailTemplates(templatesData || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error(t('adminSettings.loadError', 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const commissionDecimal = settings.commission_rate / 100;

      // Persist the platform settings row
      const { error: settingsError } = await supabase
        .from('platform_settings')
        .update({
          commission_rate: commissionDecimal,
          auto_approve_agencies: settings.auto_approve,
          email_notifications: settings.email_notifications,
          maintenance_mode: settings.maintenance_mode,
          updated_at: new Date().toISOString(),
          updated_by: profile?.id ?? null,
        })
        .eq('id', 1);

      if (settingsError) throw settingsError;

      // Update all agency commission rates to match the platform rate
      const { error: updateError } = await supabase
        .from('travel_agencies')
        .update({ commission_rate: commissionDecimal })
        .gte('id', '00000000-0000-0000-0000-000000000000'); // match all

      if (updateError) throw updateError;

      toast.success(t('adminSettings.saveSuccess', 'Settings saved successfully'));
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(t('adminSettings.saveError', 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-start">
          <h1 className="text-2xl font-bold">{t('adminSettings.title', 'Platform Settings')}</h1>
          <p className="text-muted-foreground">{t('adminSettings.subtitle', 'Configure platform-wide settings')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="me-2 h-4 w-4" />
          {saving ? t('adminSettings.saving', 'Saving...') : t('adminSettings.saveAll', 'Save All')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Settings Card */}
        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t('adminSettings.platformSettings', 'Platform Settings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commission" className="text-start block">{t('adminSettings.commissionRate', 'Commission Rate (%)')}</Label>
              <Input
                id="commission"
                type="number"
                value={settings.commission_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                className="w-32"
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">{t('adminSettings.commissionDesc', 'Applied to all agency payouts')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-start block">{t('adminSettings.platformCurrency', 'Platform Currency')}</Label>
              <Select value={settings.currency} onValueChange={(val) => setSettings(prev => ({ ...prev, currency: val }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Mirrors SUPPORTED_CURRENCIES; display currency is set via
                      VITE_PLATFORM_CURRENCY until settings persistence exists. */}
                  <SelectItem value="USD">{t('adminSettings.currencyUsd', 'US Dollar (USD)')}</SelectItem>
                  <SelectItem value="SAR">{t('adminSettings.currencySar', 'Saudi Riyal (SAR)')}</SelectItem>
                  <SelectItem value="AED">{t('adminSettings.currencyAed', 'UAE Dirham (AED)')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-start">{t('adminSettings.platformFeatures', 'Platform Features')}</h3>

              <div className="flex items-center justify-between">
                <div className="text-start">
                  <Label htmlFor="auto-approve">{t('adminSettings.autoApprove', 'Auto-approve Agencies')}</Label>
                  <p className="text-sm text-muted-foreground">{t('adminSettings.autoApproveDesc', 'Automatically approve new agency registrations')}</p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={settings.auto_approve}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_approve: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-start">
                  <Label htmlFor="email-notifications">{t('adminSettings.emailNotifications', 'Email Notifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('adminSettings.emailNotificationsDesc', 'Receive email alerts for important events')}</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, email_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-start">
                  <Label htmlFor="maintenance-mode">{t('adminSettings.maintenanceMode', 'Maintenance Mode')}</Label>
                  <p className="text-sm text-muted-foreground">{t('adminSettings.maintenanceModeDesc', 'Temporarily disable the platform for maintenance')}</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users Card — Dynamic from Supabase */}
        <Card>
          <CardHeader className="text-start">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('adminSettings.adminUsers', 'Admin Users')}
              </CardTitle>
              <Badge variant="secondary">{adminUsers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">{t('adminSettings.noAdmins', 'No admin users found')}</p>
            ) : (
              adminUsers.map(admin => (
                <div key={admin.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-start">
                      <div className="font-medium text-sm">
                        {admin.first_name} {admin.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">{admin.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{t('adminSettings.admin', 'Admin')}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Templates Card */}
      <Card>
        <CardHeader className="text-start">
          <CardTitle>{t('adminSettings.emailTemplates', 'Email Templates')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-start">{t('adminSettings.noTemplates', 'No email templates found')}</p>
            ) : (
              emailTemplates.map(template => (
                <div key={template.id} className="p-4 border rounded-lg text-start">
                  <h3 className="font-medium mb-2">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.content}</p>
                  <Button variant="outline" size="sm">{t('adminSettings.editTemplate', 'Edit Template')}</Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
