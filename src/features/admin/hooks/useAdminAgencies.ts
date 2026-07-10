import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAudit } from '../lib/audit';

export type AgencyStatus = 'pending' | 'active' | 'rejected' | 'suspended';

export interface AdminAgency {
  id: string;
  company_name: string;
  company_description: string | null;
  contact_person_first_name: string;
  contact_person_last_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  license_number: string | null;
  status: AgencyStatus;
  is_verified: boolean;
  commission_rate: number;
  rating: number;
  total_reviews: number;
  created_at: string;
  packages_count: number;
}

export interface AgencyStats {
  total: number;
  active: number;
  pending: number;
  totalPackages: number;
}

export const adminAgenciesKey = ['admin', 'agencies'] as const;

export function useAdminAgencies() {
  return useQuery({
    queryKey: adminAgenciesKey,
    queryFn: async (): Promise<{ agencies: AdminAgency[]; stats: AgencyStats }> => {
      const [agenciesRes, packagesRes] = await Promise.all([
        supabase.from('travel_agencies').select('*').order('created_at', { ascending: false }),
        supabase.from('packages').select('agency_id'),
      ]);
      if (agenciesRes.error) throw agenciesRes.error;
      if (packagesRes.error) throw packagesRes.error;

      const packagesMap = new Map<string, number>();
      for (const p of packagesRes.data ?? []) {
        packagesMap.set(p.agency_id, (packagesMap.get(p.agency_id) ?? 0) + 1);
      }

      const agencies: AdminAgency[] = (agenciesRes.data ?? []).map((a) => ({
        id: a.id,
        company_name: a.company_name,
        company_description: a.company_description,
        contact_person_first_name: a.contact_person_first_name,
        contact_person_last_name: a.contact_person_last_name,
        email: a.email,
        phone: a.phone,
        website: a.website,
        city: a.city,
        country: a.country,
        license_number: a.license_number,
        status: (a.status ?? 'pending') as AgencyStatus,
        is_verified: a.is_verified ?? false,
        commission_rate: Number(a.commission_rate ?? 0.12),
        rating: Number(a.rating ?? 0),
        total_reviews: a.total_reviews ?? 0,
        created_at: a.created_at,
        packages_count: packagesMap.get(a.id) ?? 0,
      }));

      return {
        agencies,
        stats: {
          total: agencies.length,
          active: agencies.filter((a) => a.status === 'active').length,
          pending: agencies.filter((a) => a.status === 'pending').length,
          totalPackages: packagesRes.data?.length ?? 0,
        },
      };
    },
  });
}

interface AgencyStatusInput {
  agencyId: string;
  companyName: string;
  status: AgencyStatus;
  isVerified?: boolean;
}

export function useUpdateAgencyStatus() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ agencyId, status, isVerified }: AgencyStatusInput) => {
      const update: { status: AgencyStatus; is_verified?: boolean } = { status };
      if (isVerified !== undefined) update.is_verified = isVerified;
      const { error } = await supabase.from('travel_agencies').update(update).eq('id', agencyId);
      if (error) throw error;
    },
    onSuccess: (_data, { agencyId, companyName, status, isVerified }) => {
      queryClient.invalidateQueries({ queryKey: adminAgenciesKey });
      const action =
        status === 'active' ? 'approval' : status === 'rejected' ? 'rejection' : status === 'suspended' ? 'suspension' : 'update';
      void audit({
        actionType: `agency_${action}`,
        description: `Set agency "${companyName}" status to ${status}`,
        entityType: 'agency',
        entityId: agencyId,
        metadata: { status, is_verified: isVerified },
      });
    },
  });
}

interface AgencyDetailsInput {
  agencyId: string;
  companyName: string;
  commission_rate: number;
}

export function useUpdateAgencyCommission() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ agencyId, commission_rate }: AgencyDetailsInput) => {
      const { error } = await supabase
        .from('travel_agencies')
        .update({ commission_rate })
        .eq('id', agencyId);
      if (error) throw error;
    },
    onSuccess: (_data, { agencyId, companyName, commission_rate }) => {
      queryClient.invalidateQueries({ queryKey: adminAgenciesKey });
      void audit({
        actionType: 'agency_commission_update',
        description: `Set commission rate for "${companyName}" to ${(commission_rate * 100).toFixed(1)}%`,
        entityType: 'agency',
        entityId: agencyId,
        metadata: { commission_rate },
      });
    },
  });
}

export interface AgencyPackageRow {
  id: string;
  title: string;
  title_ar: string | null;
  status: string;
  base_price: number;
  created_at: string;
}

/** Packages belonging to one agency, for the profile dialog. */
export function useAgencyPackages(agencyId: string | null) {
  return useQuery({
    queryKey: ['admin', 'agency-packages', agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgencyPackageRow[]> => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, title, title_ar, status, base_price, created_at')
        .eq('agency_id', agencyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, base_price: Number(p.base_price) }));
    },
  });
}
