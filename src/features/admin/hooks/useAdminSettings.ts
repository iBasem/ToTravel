import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAdminAudit } from '../lib/audit';

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
}

export interface PlatformSettingsValues {
  /** Whole percent, e.g. 12 for 12%. */
  commission_rate: number;
  auto_approve: boolean;
  email_notifications: boolean;
  maintenance_mode: boolean;
}

export interface EmailTemplate {
  id: string;
  title: string;
  slug: string | null;
  content_type: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const adminSettingsKey = ['admin', 'settings'] as const;

export function useAdminSettings() {
  return useQuery({
    queryKey: adminSettingsKey,
    queryFn: async (): Promise<{
      adminUsers: AdminUser[];
      settings: PlatformSettingsValues;
      emailTemplates: EmailTemplate[];
    }> => {
      const [profilesRes, settingsRes, templatesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'admin'),
        supabase.from('platform_settings').select('*').maybeSingle(),
        supabase
          .from('content_pages')
          .select('*')
          .eq('content_type', 'email_template')
          .order('created_at', { ascending: true }),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      return {
        adminUsers: (profilesRes.data ?? []).map((p) => ({
          id: p.id ?? '',
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? '',
          email: p.email ?? '',
          avatar_url: p.avatar_url,
        })),
        settings: {
          commission_rate: Math.round(Number(settingsRes.data?.commission_rate ?? 0.12) * 100),
          auto_approve: settingsRes.data?.auto_approve_agencies ?? false,
          email_notifications: settingsRes.data?.email_notifications ?? true,
          maintenance_mode: settingsRes.data?.maintenance_mode ?? false,
        },
        emailTemplates: (templatesRes.data ?? []) as EmailTemplate[],
      };
    },
  });
}

/**
 * Persists the platform_settings singleton (id = 1). Deliberately does NOT
 * touch per-agency commission rates — those are edited per agency in Agency
 * Management; platform_settings.commission_rate is only the default for
 * agencies without their own rate.
 */
export function useSavePlatformSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async (values: PlatformSettingsValues) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          commission_rate: values.commission_rate / 100,
          auto_approve_agencies: values.auto_approve,
          email_notifications: values.email_notifications,
          maintenance_mode: values.maintenance_mode,
          updated_at: new Date().toISOString(),
          updated_by: user?.id ?? null,
        })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'financials'] });
      void audit({
        actionType: 'settings_update',
        description: `Updated platform settings (commission ${values.commission_rate}%, auto-approve ${values.auto_approve ? 'on' : 'off'}, maintenance ${values.maintenance_mode ? 'on' : 'off'})`,
        entityType: 'platform_settings',
        entityId: null,
        metadata: { ...values },
      });
    },
  });
}
