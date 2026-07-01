
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Package = Database['public']['Tables']['packages']['Row'];
type PackageMedia = Database['public']['Tables']['package_media']['Row'];
type PackageRoute = Database['public']['Tables']['package_routes']['Row'];

export interface PackageWithMedia extends Package {
  package_media?: PackageMedia[];
  /* Route coordinates for static map thumbnail */
  package_routes?: Pick<PackageRoute, 'latitude' | 'longitude' | 'destination_order' | 'name'>[];
}

export function usePublishedPackages() {
  const [packages, setPackages] = useState<PackageWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('packages')
        .select(`
          *,
          package_media (*),
          package_routes (latitude, longitude, destination_order, name)
        `)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching packages:', fetchError);
        setError(fetchError.message);
        return;
      }

      setPackages(data || []);
    } catch (err) {
      console.error('Exception fetching packages:', err);
      setError('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    error,
    refetch: fetchPackages
  };
}
