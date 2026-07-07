import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgencyStats {
  tours_count: number;
  years_experience: number;
  travelers_count: number;
}

/**
 * Real operator stats for the OperatorInfo card (replaces the hardcoded
 * "50+ Tours / 5+ Years Exp. / 1K+ Travelers"). Backed by the
 * agency_public_stats RPC, which exposes only aggregate counts.
 */
export function useAgencyStats(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency-stats', agencyId],
    queryFn: async (): Promise<AgencyStats | null> => {
      if (!agencyId) return null;
      const { data, error } = await supabase.rpc('agency_public_stats', {
        agency_uuid: agencyId,
      });
      if (error) throw error;
      return (data && data[0]) || null;
    },
    enabled: !!agencyId,
  });
}
