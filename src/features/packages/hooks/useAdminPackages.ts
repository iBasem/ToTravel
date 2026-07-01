import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface Package {
  id: string;
  title: string;
  destination: string;
  base_price: number;
  duration_days: number;
  duration_nights: number;
  status: string;
  featured: boolean;
  agency_name: string;
  agency_id: string;
  created_at: string;
}

interface PackageStats {
  total: number;
  live: number;
  pending: number;
  featured: number;
}

export function useAdminPackages() {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [stats, setStats] = useState<PackageStats>({
    total: 0,
    live: 0,
    pending: 0,
    featured: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchPackages();
    }
  }, [isAdmin]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch packages with agency info
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;

      // Fetch agencies for names
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('travel_agencies')
        .select('id, company_name');

      if (agenciesError) throw agenciesError;

      // Create agency map
      const agencyMap = new Map<string, string>();
      agenciesData?.forEach(a => {
        agencyMap.set(a.id, a.company_name);
      });

      // Map packages with agency names
      const mappedPackages: Package[] = (packagesData || []).map(p => ({
        id: p.id,
        title: p.title,
        destination: p.destination,
        base_price: Number(p.base_price),
        duration_days: p.duration_days,
        duration_nights: p.duration_nights,
        status: p.status || 'draft',
        featured: p.featured || false,
        agency_name: agencyMap.get(p.agency_id) || 'Unknown Agency',
        agency_id: p.agency_id,
        created_at: p.created_at,
      }));

      setPackages(mappedPackages);

      // Calculate stats
      const total = mappedPackages.length;
      const live = mappedPackages.filter(p => p.status === 'published').length;
      const pending = mappedPackages.filter(p => p.status === 'pending' || p.status === 'draft').length;
      const featured = mappedPackages.filter(p => p.featured).length;

      setStats({ total, live, pending, featured });
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const updatePackageStatus = async (packageId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status })
        .eq('id', packageId);

      if (error) throw error;

      await fetchPackages();
      return { success: true };
    } catch (err) {
      console.error('Error updating package status:', err);
      return { success: false, error: err };
    }
  };

  const toggleFeatured = async (packageId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ featured })
        .eq('id', packageId);

      if (error) throw error;

      await fetchPackages();
      return { success: true };
    } catch (err) {
      console.error('Error toggling featured:', err);
      return { success: false, error: err };
    }
  };

  return {
    packages,
    stats,
    loading,
    error,
    refetch: fetchPackages,
    updatePackageStatus,
    toggleFeatured,
  };
}
