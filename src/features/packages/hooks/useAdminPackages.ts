import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAudit } from '@/features/admin/lib/audit';

export type PackageStatus = 'draft' | 'pending' | 'published' | 'archived' | 'suspended';

export interface AdminPackage {
  id: string;
  title: string;
  title_ar: string | null;
  destination: string;
  destination_ar: string | null;
  base_price: number;
  duration_days: number;
  duration_nights: number;
  status: PackageStatus;
  featured: boolean;
  agency_name: string;
  agency_id: string;
  created_at: string;
}

export interface PackageStats {
  total: number;
  live: number;
  pending: number;
  featured: number;
}

export const adminPackagesKey = ['admin', 'packages'] as const;

export function useAdminPackages() {
  return useQuery({
    queryKey: adminPackagesKey,
    queryFn: async (): Promise<{ packages: AdminPackage[]; stats: PackageStats }> => {
      const [packagesRes, agenciesRes] = await Promise.all([
        supabase.from('packages').select('*').order('created_at', { ascending: false }),
        supabase.from('travel_agencies').select('id, company_name'),
      ]);
      if (packagesRes.error) throw packagesRes.error;
      if (agenciesRes.error) throw agenciesRes.error;

      const agencyMap = new Map<string, string>();
      for (const a of agenciesRes.data ?? []) agencyMap.set(a.id, a.company_name);

      const packages: AdminPackage[] = (packagesRes.data ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        title_ar: p.title_ar,
        destination: p.destination,
        destination_ar: p.destination_ar,
        base_price: Number(p.base_price),
        duration_days: p.duration_days,
        duration_nights: p.duration_nights,
        status: (p.status ?? 'draft') as PackageStatus,
        featured: p.featured ?? false,
        agency_name: agencyMap.get(p.agency_id) ?? '',
        agency_id: p.agency_id,
        created_at: p.created_at,
      }));

      return {
        packages,
        stats: {
          total: packages.length,
          live: packages.filter((p) => p.status === 'published').length,
          pending: packages.filter((p) => p.status === 'pending').length,
          featured: packages.filter((p) => p.featured).length,
        },
      };
    },
  });
}

const statusActionType: Record<PackageStatus, string> = {
  published: 'package_approve',
  draft: 'package_reject',
  suspended: 'package_suspend',
  archived: 'package_archive',
  pending: 'package_update',
};

interface PackageStatusInput {
  packageId: string;
  packageTitle: string;
  status: PackageStatus;
}

export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ packageId, status }: PackageStatusInput) => {
      const { error } = await supabase.from('packages').update({ status }).eq('id', packageId);
      if (error) throw error;
    },
    onSuccess: (_data, { packageId, packageTitle, status }) => {
      queryClient.invalidateQueries({ queryKey: adminPackagesKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'package', packageId] });
      void audit({
        actionType: statusActionType[status],
        description: `Set package "${packageTitle}" status to ${status}`,
        entityType: 'package',
        entityId: packageId,
        metadata: { status },
      });
    },
  });
}

interface ToggleFeaturedInput {
  packageId: string;
  packageTitle: string;
  featured: boolean;
}

export function useTogglePackageFeatured() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ packageId, featured }: ToggleFeaturedInput) => {
      const { error } = await supabase.from('packages').update({ featured }).eq('id', packageId);
      if (error) throw error;
    },
    onSuccess: (_data, { packageId, packageTitle, featured }) => {
      queryClient.invalidateQueries({ queryKey: adminPackagesKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'package', packageId] });
      void audit({
        actionType: 'package_feature',
        description: `${featured ? 'Featured' : 'Unfeatured'} package "${packageTitle}"`,
        entityType: 'package',
        entityId: packageId,
        metadata: { featured },
      });
    },
  });
}
