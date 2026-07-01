
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Package = Database['public']['Tables']['packages']['Row'];
type PackageMedia = Database['public']['Tables']['package_media']['Row'];

export interface PackageWithMedia extends Package {
  package_media?: PackageMedia[];
}

export function useFeaturedPackages(limit: number = 4) {
  const [packages, setPackages] = useState<PackageWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('packages')
        .select(`
          *,
          package_media (*)
        `)
        .eq('status', 'published')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        console.error('Error fetching featured packages:', fetchError);
        setError(fetchError.message);
        return;
      }

      setPackages(data || []);
    } catch (err) {
      console.error('Exception fetching featured packages:', err);
      setError('Failed to fetch featured packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedPackages();
  }, [limit]);

  return {
    packages,
    loading,
    error,
    refetch: fetchFeaturedPackages
  };
}
