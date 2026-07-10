import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAdminAudit } from '../lib/audit';

export interface ContentPage {
  id: string;
  title: string;
  slug: string | null;
  content_type: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ContentStats {
  totalPages: number;
  blogPosts: number;
  draftContent: number;
}

export interface ContentPageInput {
  title: string;
  slug: string | null;
  content_type: string;
  content: string | null;
  status: string;
}

export const adminContentKey = ['admin', 'content'] as const;

export function useAdminContent() {
  return useQuery({
    queryKey: adminContentKey,
    queryFn: async (): Promise<{ content: ContentPage[]; stats: ContentStats }> => {
      const { data, error } = await supabase
        .from('content_pages')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const content = (data ?? []) as ContentPage[];
      return {
        content,
        stats: {
          totalPages: content.filter((c) => c.content_type === 'page' || c.content_type === 'legal').length,
          blogPosts: content.filter((c) => c.content_type === 'blog').length,
          draftContent: content.filter((c) => c.status === 'draft').length,
        },
      };
    },
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async (input: ContentPageInput) => {
      const { data, error } = await supabase
        .from('content_pages')
        .insert([{ ...input, author_id: user?.id }])
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, input) => {
      queryClient.invalidateQueries({ queryKey: adminContentKey });
      void audit({
        actionType: 'content_create',
        description: `Created ${input.content_type} "${input.title}" (${input.status})`,
        entityType: 'content_page',
        entityId: data.id,
        metadata: { slug: input.slug, content_type: input.content_type, status: input.status },
      });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ id, ...input }: ContentPageInput & { id: string }) => {
      const { error } = await supabase.from('content_pages').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { id, ...input }) => {
      queryClient.invalidateQueries({ queryKey: adminContentKey });
      void audit({
        actionType: 'content_update',
        description: `Updated ${input.content_type} "${input.title}" (${input.status})`,
        entityType: 'content_page',
        entityId: id,
        metadata: { slug: input.slug, content_type: input.content_type, status: input.status },
      });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ id }: { id: string; title: string }) => {
      const { error } = await supabase.from('content_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { id, title }) => {
      queryClient.invalidateQueries({ queryKey: adminContentKey });
      void audit({
        actionType: 'content_delete',
        description: `Deleted content page "${title}"`,
        entityType: 'content_page',
        entityId: id,
        metadata: {},
      });
    },
  });
}
