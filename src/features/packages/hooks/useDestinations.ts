import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type DestinationRow = Database['public']['Tables']['destinations']['Row'];

export interface DestinationWithStats extends DestinationRow {
  tour_count: number;
  average_price: number | null;
  average_rating: number | null;
}

/**
 * Destinations catalog (replaces the hardcoded DESTINATION_DATA array and the
 * home-page destinationCards array). For country cards the live tour count,
 * average price and average rating come from the destination_stats view,
 * which aggregates over published packages.
 */
export function useDestinations(kind: 'country' | 'region') {
  return useQuery({
    queryKey: ['destinations', kind],
    queryFn: async (): Promise<DestinationWithStats[]> => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('kind', kind)
        .order('display_order', { ascending: true });

      if (error) throw error;
      const rows = data ?? [];

      if (kind !== 'country') {
        return rows.map(d => ({ ...d, tour_count: 0, average_price: null, average_rating: null }));
      }

      const { data: stats, error: statsError } = await supabase
        .from('destination_stats')
        .select('*');

      if (statsError) throw statsError;
      const bySlug = new Map((stats ?? []).map(s => [s.slug, s]));

      return rows.map(d => {
        const s = bySlug.get(d.slug);
        return {
          ...d,
          tour_count: s?.tour_count ?? 0,
          average_price: s?.average_price ?? null,
          average_rating: s?.average_rating ?? null,
        };
      });
    },
  });
}
