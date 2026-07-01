import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface Agency {
  id: string;
  company_name: string;
  contact_person_first_name: string;
  contact_person_last_name: string;
  email: string;
  phone: string | null;
  status: string;
  is_verified: boolean;
  commission_rate: number;
  created_at: string;
  packages_count: number;
}

interface AgencyStats {
  total: number;
  approved: number;
  pending: number;
  totalPackages: number;
}

export function useAdminAgencies() {
  const { profile } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [stats, setStats] = useState<AgencyStats>({
    total: 0,
    approved: 0,
    pending: 0,
    totalPackages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAgencies();
    }
  }, [isAdmin]);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch agencies
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('travel_agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (agenciesError) throw agenciesError;

      // Fetch package counts
      const { data: packageCounts, error: packageError } = await supabase
        .from('packages')
        .select('agency_id');

      if (packageError) throw packageError;

      // Count packages per agency
      const packagesMap = new Map<string, number>();
      packageCounts?.forEach(p => {
        packagesMap.set(p.agency_id, (packagesMap.get(p.agency_id) || 0) + 1);
      });

      // Map agencies with package counts
      const mappedAgencies: Agency[] = (agenciesData || []).map(a => ({
        id: a.id,
        company_name: a.company_name,
        contact_person_first_name: a.contact_person_first_name,
        contact_person_last_name: a.contact_person_last_name,
        email: a.email,
        phone: a.phone,
        status: a.status || 'pending',
        is_verified: a.is_verified || false,
        commission_rate: Number(a.commission_rate) || 0.12,
        created_at: a.created_at,
        packages_count: packagesMap.get(a.id) || 0,
      }));

      setAgencies(mappedAgencies);

      // Calculate stats
      const total = mappedAgencies.length;
      const approved = mappedAgencies.filter(a => a.status === 'approved' || a.is_verified).length;
      const pending = mappedAgencies.filter(a => a.status === 'pending' && !a.is_verified).length;
      const totalPackages = packageCounts?.length || 0;

      setStats({ total, approved, pending, totalPackages });
    } catch (err) {
      console.error('Error fetching agencies:', err);
      setError('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const updateAgencyStatus = async (agencyId: string, status: string, isVerified?: boolean) => {
    try {
      const updateData: { status: string; is_verified?: boolean } = { status };
      if (isVerified !== undefined) {
        updateData.is_verified = isVerified;
      }

      const { error } = await supabase
        .from('travel_agencies')
        .update(updateData)
        .eq('id', agencyId);

      if (error) throw error;

      await fetchAgencies();
      return { success: true };
    } catch (err) {
      console.error('Error updating agency status:', err);
      return { success: false, error: err };
    }
  };

  return {
    agencies,
    stats,
    loading,
    error,
    refetch: fetchAgencies,
    updateAgencyStatus,
  };
}
