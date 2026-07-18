import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface AgencyAuditEntry {
    actionType: string;
    description: string;
    entityType?: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Writes a row to agency_activity_logs (RLS: own rows; admins read all).
 * Mirrors the admin audit pattern (audit AGY-31): call after a high-value
 * mutation succeeds. A failed audit write never fails the action itself.
 */
export async function logAgencyAction(
    agencyId: string | null | undefined,
    entry: AgencyAuditEntry,
): Promise<void> {
    if (!agencyId) return;
    const { error } = await supabase.from('agency_activity_logs').insert({
        agency_id: agencyId,
        action_type: entry.actionType,
        action_description: entry.description,
        entity_type: entry.entityType ?? null,
        entity_id: entry.entityId ?? null,
        metadata: (entry.metadata ?? {}) as Json,
    });
    if (error) {
        console.error('Failed to write agency activity log:', error);
    }
}

/** Binds logAgencyAction to the signed-in agency. */
export function useAgencyAudit() {
    const { user } = useAuth();
    return useCallback(
        (entry: AgencyAuditEntry) => logAgencyAction(user?.id, entry),
        [user?.id],
    );
}

/** Fire-and-forget client error report (root/route ErrorBoundary). */
export async function reportClientError(err: unknown, path: string): Promise<void> {
    try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return; // insert policy is authenticated-only
        const e = err instanceof Error ? err : new Error(String(err));
        await supabase.from('client_errors').insert({
            user_id: data.user.id,
            message: e.message.slice(0, 2000),
            stack: (e.stack ?? '').slice(0, 8000),
            path,
        });
    } catch {
        // Never let error reporting throw.
    }
}
