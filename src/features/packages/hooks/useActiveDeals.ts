import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Public deals feed. Rows come from the active_deals view, which only exposes
 * agency deals that an admin approved, are currently running (status 'active'
 * and today within start/end dates) and point at a published package. The
 * view also computes sale_price from the package base price.
 */
export type ActiveDeal = Database['public']['Views']['active_deals']['Row'];

export function useActiveDeals() {
  return useQuery({
    queryKey: ['active-deals'],
    queryFn: async (): Promise<ActiveDeal[]> => {
      const { data, error } = await supabase
        .from('active_deals')
        .select('*')
        .order('discount_percentage', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Best (highest-discount) active deal per package id. */
export function dealsByPackageId(deals: ActiveDeal[]): Map<string, ActiveDeal> {
  const map = new Map<string, ActiveDeal>();
  for (const deal of deals) {
    if (!deal.package_id) continue;
    const existing = map.get(deal.package_id);
    if (!existing || (deal.discount_percentage ?? 0) > (existing.discount_percentage ?? 0)) {
      map.set(deal.package_id, deal);
    }
  }
  return map;
}
