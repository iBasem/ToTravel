import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ActivityLogEntry = Database['public']['Tables']['admin_activity_logs']['Row'];

export const ACTIVITY_LOG_PAGE_SIZE = 25;

export const ADMIN_ACTIVITY_LOG_QUERY_KEY = ['admin', 'activity-log'] as const;

/** Fixed, well-known action types offered in the filter dropdown. */
export const KNOWN_ACTIVITY_ACTION_TYPES = [
  'approval',
  'rejection',
  'suspension',
  'refund',
  'update',
  'delete',
  'create',
  'settings_update',
] as const;

export interface ActivityLogFilters {
  page: number;
  actionType: string | null;
  search: string;
}

export interface ActivityLogPage {
  entries: ActivityLogEntry[];
  total: number;
  pageCount: number;
}

/** Escapes characters PostgREST treats specially inside an .or() ilike arm. */
function toIlikePattern(search: string): string {
  return `%${search.replace(/[%_\\]/g, '\\$&').replace(/[,()]/g, ' ')}%`;
}

/**
 * Read-only, paginated feed of admin_activity_logs (append-only table:
 * admins can SELECT and INSERT, never update or delete). Newest first,
 * filtered server-side so pagination stays correct.
 */
export function useAdminActivityLog({ page, actionType, search }: ActivityLogFilters) {
  return useQuery({
    queryKey: [...ADMIN_ACTIVITY_LOG_QUERY_KEY, { page, actionType, search }],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ActivityLogPage> => {
      const from = page * ACTIVITY_LOG_PAGE_SIZE;
      const to = from + ACTIVITY_LOG_PAGE_SIZE - 1;

      let query = supabase
        .from('admin_activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const trimmed = search.trim();
      if (trimmed) {
        const pattern = toIlikePattern(trimmed);
        query = query.or(
          `user_name.ilike.${pattern},action_description.ilike.${pattern}`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const total = count ?? 0;
      return {
        entries: data ?? [],
        total,
        pageCount: Math.max(1, Math.ceil(total / ACTIVITY_LOG_PAGE_SIZE)),
      };
    },
  });
}

/** Known action types merged with whatever actually appears in the data. */
export function mergeActionTypes(entries: ActivityLogEntry[]): string[] {
  const types = new Set<string>(KNOWN_ACTIVITY_ACTION_TYPES);
  for (const entry of entries) {
    if (entry.action_type) types.add(entry.action_type);
  }
  return Array.from(types).sort();
}
