import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Separator } from "@/ui/separator";
import { Skeleton } from "@/ui/skeleton";
import { Badge } from "@/ui/badge";
import { EmptyState } from "@/ui/empty-state";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Save, Users, Shield, Edit } from "lucide-react";
import {
  useAdminSettings,
  useSavePlatformSettings,
  adminSettingsKey,
  type PlatformSettingsValues,
  type EmailTemplate,
} from "@/features/admin/hooks/useAdminSettings";
import { useUpdateContent, type ContentPageInput } from "@/features/admin/hooks/useAdminContent";
import { ContentFormDialog } from "@/features/admin/components/ContentFormDialog";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/ui/page-header";

export default function AdminSettings() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useAdminSettings();
  const saveSettings = useSavePlatformSettings();
  const updateContent = useUpdateContent();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PlatformSettingsValues>({
    commission_rate: 12,
    auto_approve: false,
    email_notifications: true,
    maintenance_mode: false,
  });
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);

  // Hydrate the form from the server exactly once. Re-syncing on every
  // refetch would clobber edits made while a save's invalidation refetch is
  // in flight (the save round-trips the form, so later server echoes add
  // nothing).
  const hydrated = useRef(false);
  useEffect(() => {
    if (data?.settings && !hydrated.current) {
      setForm(data.settings);
      hydrated.current = true;
    }
  }, [data?.settings]);

  const adminUsers = data?.adminUsers ?? [];
  const emailTemplates = data?.emailTemplates ?? [];

  const handleSave = () => {
    if (form.commission_rate < 0 || form.commission_rate > 100 || Number.isNaN(form.commission_rate)) {
      toast.error(t("adminSettings.commissionRange", "Commission rate must be between 0 and 100"));
      return;
    }
    saveSettings.mutate(form, {
      onSuccess: () => toast.success(t("adminSettings.saveSuccess", "Settings saved successfully")),
      onError: () => toast.error(t("adminSettings.saveError", "Failed to save settings")),
    });
  };

  const handleSaveTemplate = (values: ContentPageInput) => {
    if (!editTemplate) return;
    updateContent.mutate(
      { id: editTemplate.id, ...values },
      {
        onSuccess: () => {
          toast.success(t("adminSettings.templateSaved", "Template updated"));
          queryClient.invalidateQueries({ queryKey: adminSettingsKey });
          setEditTemplate(null);
        },
        onError: () => toast.error(t("adminSettings.templateSaveError", "Failed to update template")),
      },
    );
  };

  if (isLoading) {
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

  if (isError) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={t("adminSettings.loadError", "Failed to load settings")}
        description={t("adminSettings.loadErrorDescription", "Something went wrong while loading platform settings. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("adminSettings.title", "Platform Settings")}
        description={t("adminSettings.subtitle", "Configure platform-wide settings")}
        actions={
          <Button onClick={handleSave} disabled={saveSettings.isPending}>
            <Save className="me-2 h-4 w-4" />
            {saveSettings.isPending ? t("adminSettings.saving", "Saving...") : t("adminSettings.saveAll", "Save All")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Settings Card */}
        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t("adminSettings.platformSettings", "Platform Settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commission" className="text-start block">
                {t("adminSettings.commissionRate", "Commission Rate (%)")}
              </Label>
              <Input
                id="commission"
                type="number"
                dir="ltr"
                value={form.commission_rate}
                onChange={(e) => setForm((prev) => ({ ...prev, commission_rate: Number(e.target.value) }))}
                className="w-32"
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground text-start">
                {t("adminSettings.commissionDefaultDesc", "Default rate for agencies without a custom rate. Per-agency rates are edited in Agency Management.")}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-start block">{t("adminSettings.platformCurrency", "Platform Currency")}</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {t("adminSettings.currencySar", "Saudi Riyal (SAR)")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-start">
                {t("adminSettings.currencyFixedDesc", "All payments are processed in SAR through Moyasar; the platform currency is fixed.")}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-start">{t("adminSettings.platformFeatures", "Platform Features")}</h3>

              <div className="flex items-center justify-between">
                <div className="text-start">
                  <Label htmlFor="auto-approve">{t("adminSettings.autoApprove", "Auto-approve Agencies")}</Label>
                  <p className="text-sm text-muted-foreground">{t("adminSettings.autoApproveDesc", "Automatically approve new agency registrations")}</p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={form.auto_approve}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, auto_approve: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-start">
                  <Label htmlFor="email-notifications">{t("adminSettings.emailNotifications", "Email Notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("adminSettings.emailNotificationsDesc", "Receive email alerts for important events")}</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={form.email_notifications}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, email_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-start">
                  <Label htmlFor="maintenance-mode">{t("adminSettings.maintenanceMode", "Maintenance Mode")}</Label>
                  <p className="text-sm text-muted-foreground">{t("adminSettings.maintenanceModeDesc", "Temporarily disable the platform for maintenance")}</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={form.maintenance_mode}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, maintenance_mode: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users Card */}
        <Card>
          <CardHeader className="text-start">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("adminSettings.adminUsers", "Admin Users")}
              </CardTitle>
              <Badge variant="secondary">{adminUsers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">{t("adminSettings.noAdmins", "No admin users found")}</p>
            ) : (
              adminUsers.map((admin) => (
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
                  <Badge variant="outline" className="text-xs">
                    {t("adminSettings.admin", "Admin")}
                  </Badge>
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground text-start">
              {t("adminSettings.adminUsersHint", "Admin roles are granted by the platform operator; they cannot be changed from this screen.")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates Card */}
      <Card>
        <CardHeader className="text-start">
          <CardTitle>{t("adminSettings.emailTemplates", "Email Templates")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-start">{t("adminSettings.noTemplates", "No email templates found")}</p>
            ) : (
              emailTemplates.map((template) => (
                <div key={template.id} className="p-4 border rounded-lg text-start">
                  <h3 className="font-medium mb-2">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{template.content}</p>
                  <Button variant="outline" size="sm" onClick={() => setEditTemplate(template)}>
                    <Edit className="w-4 h-4 me-2" />
                    {t("adminSettings.editTemplate", "Edit Template")}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ContentFormDialog
        open={!!editTemplate}
        page={editTemplate}
        fixedType="email_template"
        saving={updateContent.isPending}
        onClose={() => setEditTemplate(null)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
