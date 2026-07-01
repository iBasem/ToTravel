import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface ContentPage {
  id: string;
  title: string;
  slug: string | null;
  content_type: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContentStats {
  totalPages: number;
  blogPosts: number;
  draftContent: number;
}

export function useAdminContent() {
  const { profile } = useAuth();
  const [content, setContent] = useState<ContentPage[]>([]);
  const [stats, setStats] = useState<ContentStats>({
    totalPages: 0,
    blogPosts: 0,
    draftContent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchContent();
    }
  }, [isAdmin]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: contentData, error: contentError } = await supabase
        .from('content_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      // Handle case where table might not exist
      const contentArray = contentError ? [] : (contentData || []);

      const mappedContent: ContentPage[] = contentArray.map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        content_type: c.content_type,
        content: c.content,
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      setContent(mappedContent);

      // Calculate stats
      const totalPages = mappedContent.filter(c => c.content_type === 'page' || c.content_type === 'legal').length;
      const blogPosts = mappedContent.filter(c => c.content_type === 'blog').length;
      const draftContent = mappedContent.filter(c => c.status === 'draft').length;

      setStats({ totalPages, blogPosts, draftContent });
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const createContent = async (data: { title: string; content_type?: string; content?: string; status?: string; slug?: string }) => {
    try {
      const { error } = await supabase
        .from('content_pages')
        .insert([{
          title: data.title,
          content_type: data.content_type || 'page',
          content: data.content,
          status: data.status || 'draft',
          slug: data.slug,
        }]);

      if (error) throw error;

      await fetchContent();
      return { success: true };
    } catch (err) {
      console.error('Error creating content:', err);
      return { success: false, error: err };
    }
  };

  const updateContent = async (id: string, data: Partial<ContentPage>) => {
    try {
      const { error } = await supabase
        .from('content_pages')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      await fetchContent();
      return { success: true };
    } catch (err) {
      console.error('Error updating content:', err);
      return { success: false, error: err };
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchContent();
      return { success: true };
    } catch (err) {
      console.error('Error deleting content:', err);
      return { success: false, error: err };
    }
  };

  return {
    content,
    stats,
    loading,
    error,
    refetch: fetchContent,
    createContent,
    updateContent,
    deleteContent,
  };
}
