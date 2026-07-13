import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shortId } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type PendingAction = Database['public']['Tables']['admin_pending_actions']['Row'];
type PendingActionUpdate = Database['public']['Tables']['admin_pending_actions']['Update'];
type ProfileRow = Database['public']['Views']['profiles']['Row'];

export type PendingActionStatus = 'pending' | 'in_progress' | 'resolved' | 'dismissed';
export type PendingActionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AdminUserOption {
  id: string;
  name: string;
  email: string | null;
}

export interface PendingActionsStats {
  open: number;
  urgent: number;
  inProgress: number;
  resolvedToday: number;
}

export const ADMIN_PENDING_ACTIONS_QUERY_KEY = ['admin', 'pending-actions'] as const;
export const ADMIN_USERS_QUERY_KEY = ['admin', 'admin-users'] as const;

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Full moderation queue of admin_pending_actions (RLS: admins have full
 * access). Rows come back sorted urgent -> high -> medium -> low, oldest
 * first within the same priority.
 */
export function useAdminPendingActions() {
  return useQuery({
    queryKey: ADMIN_PENDING_ACTIONS_QUERY_KEY,
    queryFn: async (): Promise<PendingAction[]> => {
      const { data, error } = await supabase
        .from('admin_pending_actions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return sortPendingActions(data ?? []);
    },
  });
}

/** Urgent first, then by descending priority; oldest first inside a tier. */
export function sortPendingActions(actions: PendingAction[]): PendingAction[] {
  return [...actions].sort((a, b) => {
    const rankDiff =
      (PRIORITY_RANK[a.priority] ?? PRIORITY_RANK.low) -
      (PRIORITY_RANK[b.priority] ?? PRIORITY_RANK.low);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/** Derives header stats from the loaded queue. */
export function computePendingActionsStats(actions: PendingAction[]): PendingActionsStats {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let open = 0;
  let urgent = 0;
  let inProgress = 0;
  let resolvedToday = 0;

  for (const action of actions) {
    const isOpen = action.status === 'pending' || action.status === 'in_progress';
    if (action.status === 'pending') open += 1;
    if (action.status === 'in_progress') inProgress += 1;
    if (isOpen && action.priority === 'urgent') urgent += 1;
    if (
      action.status === 'resolved' &&
      action.resolved_at &&
      new Date(action.resolved_at).getTime() >= startOfToday.getTime()
    ) {
      resolvedToday += 1;
    }
  }

  return { open, urgent, inProgress, resolvedToday };
}

/**
 * Admin users for the "assign to" dropdown, read from the public.profiles
 * view (role = 'admin').
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: async (): Promise<AdminUserOption[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('role', 'admin');

      if (error) throw error;

      return (data ?? [])
        .filter((profile): profile is ProfileRow & { id: string } => Boolean(profile.id))
        .map((profile) => ({
          id: profile.id,
          name:
            [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
            profile.email?.split('@')[0] ||
            shortId(profile.id),
          email: profile.email,
        }));
    },
  });
}

export interface UpdatePendingActionInput {
  id: string;
  patch: Pick<
    PendingActionUpdate,
    'status' | 'assigned_to' | 'resolved_by' | 'resolved_at'
  >;
}

/**
 * Shared mutation for Start / Assign / Resolve / Dismiss. `.select('id')`
 * makes a silent RLS no-op surface as an error instead of a fake success.
 * Invalidates the queue on success; toast + audit log are the caller's
 * responsibility (the caller knows the action semantics).
 */
export function useUpdatePendingAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: UpdatePendingActionInput): Promise<void> => {
      const { data, error } = await supabase
        .from('admin_pending_actions')
        .update(patch)
        .eq('id', id)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Pending action not found or not permitted');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PENDING_ACTIONS_QUERY_KEY });
    },
  });
}
