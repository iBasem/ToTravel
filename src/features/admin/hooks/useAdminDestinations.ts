import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAdminAudit } from '@/features/admin/lib/audit';

export type AdminDestination = Database['public']['Tables']['destinations']['Row'];
export type DestinationInsert = Database['public']['Tables']['destinations']['Insert'];
export type DestinationUpdate = Database['public']['Tables']['destinations']['Update'];

export const ADMIN_DESTINATIONS_KEY = ['admin', 'destinations'] as const;

/**
 * Admin CRUD for public.destinations (admins have full ALL access under RLS).
 * Every mutation writes an admin activity log entry after it succeeds.
 */
export function useAdminDestinations() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  const query = useQuery({
    queryKey: ADMIN_DESTINATIONS_KEY,
    queryFn: async (): Promise<AdminDestination[]> => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_DESTINATIONS_KEY });

  const createDestination = useMutation({
    mutationFn: async (values: DestinationInsert): Promise<AdminDestination> => {
      const { data, error } = await supabase
        .from('destinations')
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      invalidate();
      audit({
        actionType: 'destination_create',
        description: `Created destination ${created.name}`,
        entityType: 'destination',
        entityId: created.id,
        metadata: { slug: created.slug, kind: created.kind },
      });
    },
  });

  const updateDestination = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: DestinationUpdate;
    }): Promise<AdminDestination> => {
      const { data, error } = await supabase
        .from('destinations')
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      invalidate();
      audit({
        actionType: 'destination_update',
        description: `Updated destination ${updated.name}`,
        entityType: 'destination',
        entityId: updated.id,
        metadata: { slug: updated.slug, kind: updated.kind },
      });
    },
  });

  const deleteDestination = useMutation({
    mutationFn: async (destination: { id: string; name: string; slug: string }) => {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', destination.id);

      if (error) throw error;
      return destination;
    },
    onSuccess: (deleted) => {
      invalidate();
      audit({
        actionType: 'destination_delete',
        description: `Deleted destination ${deleted.name}`,
        entityType: 'destination',
        entityId: deleted.id,
        metadata: { slug: deleted.slug },
      });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({
      id,
      featured,
      name,
    }: {
      id: string;
      featured: boolean;
      name: string;
    }) => {
      const { error } = await supabase
        .from('destinations')
        .update({ featured })
        .eq('id', id);

      if (error) throw error;
      return { id, featured, name };
    },
    onSuccess: ({ id, featured, name }) => {
      invalidate();
      audit({
        actionType: 'destination_feature',
        description: `${featured ? 'Featured' : 'Unfeatured'} destination ${name}`,
        entityType: 'destination',
        entityId: id,
        metadata: { featured },
      });
    },
  });

  /**
   * Persists a full reordered list: display_order is reassigned from the array
   * index and only rows whose display_order actually changed are updated.
   * The cache is updated optimistically so drag-and-drop feels instant.
   */
  const reorderDestinations = useMutation({
    mutationFn: async (ordered: AdminDestination[]) => {
      const changed = ordered
        .map((destination, index) => ({ id: destination.id, display_order: index }))
        .filter((row, index) => ordered[index].display_order !== row.display_order);

      const results = await Promise.all(
        changed.map((row) =>
          supabase
            .from('destinations')
            .update({ display_order: row.display_order })
            .eq('id', row.id),
        ),
      );
      for (const result of results) {
        if (result.error) throw result.error;
      }
      return changed;
    },
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_DESTINATIONS_KEY });
      const previous = queryClient.getQueryData<AdminDestination[]>(ADMIN_DESTINATIONS_KEY);
      queryClient.setQueryData<AdminDestination[]>(
        ADMIN_DESTINATIONS_KEY,
        ordered.map((destination, index) => ({ ...destination, display_order: index })),
      );
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_DESTINATIONS_KEY, context.previous);
      }
    },
    onSuccess: (changed) => {
      audit({
        actionType: 'destination_reorder',
        description: `Reordered destinations (${changed.length} rows changed)`,
        entityType: 'destination',
        metadata: { changedIds: changed.map((row) => row.id) },
      });
    },
    onSettled: () => invalidate(),
  });

  return {
    destinations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createDestination,
    updateDestination,
    deleteDestination,
    toggleFeatured,
    reorderDestinations,
  };
}
