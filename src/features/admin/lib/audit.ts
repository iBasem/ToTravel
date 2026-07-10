import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface AdminAuditEntry {
  actionType: string;
  description: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Writes a row to admin_activity_logs (RLS: admins only). Every admin
 * mutation must call this after it succeeds. A failed audit write never
 * fails the action itself — the action already happened.
 */
export async function logAdminAction(
  actor: { id?: string | null; name: string },
  entry: AdminAuditEntry,
): Promise<void> {
  const { error } = await supabase.from('admin_activity_logs').insert({
    user_id: actor.id ?? null,
    user_name: actor.name,
    action_type: entry.actionType,
    action_description: entry.description,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    metadata: (entry.metadata ?? {}) as never,
  });
  if (error) {
    console.error('Failed to write admin activity log:', error);
  }
}

/** Binds logAdminAction to the signed-in admin's identity. */
export function useAdminAudit() {
  const { user, profile } = useAuth();

  return useCallback(
    (entry: AdminAuditEntry) => {
      const name =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
        user?.email ||
        'Admin';
      return logAdminAction({ id: user?.id, name }, entry);
    },
    [user?.id, user?.email, profile?.first_name, profile?.last_name],
  );
}
