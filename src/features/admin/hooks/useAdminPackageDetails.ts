import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAdminAudit } from '../lib/audit';

export type AdminPackageRow = Tables<'packages'>;
export type AdminPackageMedia = Tables<'package_media'>;
export type AdminItineraryDay = Tables<'itineraries'>;
export type AdminPackageRoute = Tables<'package_routes'>;

export type AdminPackageAgency = Pick<
  Tables<'travel_agencies'>,
  'id' | 'company_name' | 'email' | 'phone' | 'is_verified' | 'status'
>;

export interface AdminDepartureRow extends Tables<'package_departures'> {
  booked: number;
  seats_remaining: number;
}

export interface AdminPackageDetailsData {
  package: AdminPackageRow | null;
  agency: AdminPackageAgency | null;
  media: AdminPackageMedia[];
  itinerary: AdminItineraryDay[];
  routes: AdminPackageRoute[];
  departures: AdminDepartureRow[];
}

export const adminPackageKey = (id: string | undefined) => ['admin', 'package', id] as const;
export const adminPackagesListKey = ['admin', 'packages'] as const;

/**
 * Everything an admin needs to inspect one package end-to-end:
 * the package row, its agency, media, itinerary, route and departures.
 * Admin RLS grants SELECT on all of these tables.
 */
export function useAdminPackageDetails(id: string | undefined) {
  return useQuery({
    queryKey: adminPackageKey(id),
    enabled: !!id,
    queryFn: async (): Promise<AdminPackageDetailsData> => {
      const [pkgRes, mediaRes, itineraryRes, routesRes, departuresRes, bookingsRes] =
        await Promise.all([
          supabase.from('packages').select('*').eq('id', id!).maybeSingle(),
          supabase
            .from('package_media')
            .select('*')
            .eq('package_id', id!)
            .order('display_order', { ascending: true }),
          supabase
            .from('itineraries')
            .select('*')
            .eq('package_id', id!)
            .order('day_number', { ascending: true }),
          supabase
            .from('package_routes')
            .select('*')
            .eq('package_id', id!)
            .order('destination_order', { ascending: true }),
          supabase
            .from('package_departures')
            .select('*')
            .eq('package_id', id!)
            .order('departure_date', { ascending: true }),
          supabase
            .from('package_bookings')
            .select('booking_date, participants, status')
            .eq('package_id', id!),
        ]);

      if (pkgRes.error) throw pkgRes.error;
      if (mediaRes.error) throw mediaRes.error;
      if (itineraryRes.error) throw itineraryRes.error;
      if (routesRes.error) throw routesRes.error;
      if (departuresRes.error) throw departuresRes.error;

      const pkg = pkgRes.data ?? null;

      // Agency needs the package's agency_id, so it can't join the batch above.
      let agency: AdminPackageAgency | null = null;
      if (pkg?.agency_id) {
        const { data: agencyData } = await supabase
          .from('travel_agencies')
          .select('id, company_name, email, phone, is_verified, status')
          .eq('id', pkg.agency_id)
          .maybeSingle();
        agency = agencyData ?? null;
      }

      // Booked seats are derived from bookings at read time (same convention
      // as useDepartures). Cancelled bookings don't count.
      const bookedByDate = new Map<string, number>();
      (bookingsRes.data ?? []).forEach((b) => {
        if (b.status === 'cancelled') return;
        bookedByDate.set(
          b.booking_date,
          (bookedByDate.get(b.booking_date) || 0) + (b.participants || 0),
        );
      });

      const departures: AdminDepartureRow[] = (departuresRes.data ?? []).map((d) => {
        const booked = bookedByDate.get(d.departure_date) || 0;
        return { ...d, booked, seats_remaining: Math.max(0, d.total_seats - booked) };
      });

      return {
        package: pkg,
        agency,
        media: mediaRes.data ?? [],
        itinerary: itineraryRes.data ?? [],
        routes: routesRes.data ?? [],
        departures,
      };
    },
  });
}

export type PackageModerationAction =
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'archive'
  | 'unpublish'
  | 'republish';

const ACTION_TO_STATUS: Record<PackageModerationAction, string> = {
  approve: 'published',
  reject: 'draft',
  suspend: 'suspended',
  archive: 'archived',
  unpublish: 'draft',
  republish: 'published',
};

const ACTION_TO_AUDIT: Record<PackageModerationAction, string> = {
  approve: 'package_approve',
  reject: 'package_reject',
  suspend: 'package_suspend',
  archive: 'package_archive',
  unpublish: 'package_reject',
  republish: 'package_approve',
};

interface PackageStatusInput {
  packageId: string;
  title: string;
  action: PackageModerationAction;
}

/** Moderation status transitions on a package, with audit trail. */
export function useUpdateAdminPackageStatus() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ packageId, action }: PackageStatusInput) => {
      const status = ACTION_TO_STATUS[action];
      const { error } = await supabase.from('packages').update({ status }).eq('id', packageId);
      if (error) throw error;
      return status;
    },
    onSuccess: (status, { packageId, title, action }) => {
      queryClient.invalidateQueries({ queryKey: adminPackageKey(packageId) });
      queryClient.invalidateQueries({ queryKey: adminPackagesListKey });
      void audit({
        actionType: ACTION_TO_AUDIT[action],
        description: `Set package "${title}" status to ${status} (${action})`,
        entityType: 'package',
        entityId: packageId,
        metadata: { action, status },
      });
    },
  });
}

interface PackageFeaturedInput {
  packageId: string;
  title: string;
  featured: boolean;
}

/** Toggles the featured flag on a package, with audit trail. */
export function useToggleAdminPackageFeatured() {
  const queryClient = useQueryClient();
  const audit = useAdminAudit();

  return useMutation({
    mutationFn: async ({ packageId, featured }: PackageFeaturedInput) => {
      const { error } = await supabase.from('packages').update({ featured }).eq('id', packageId);
      if (error) throw error;
    },
    onSuccess: (_data, { packageId, title, featured }) => {
      queryClient.invalidateQueries({ queryKey: adminPackageKey(packageId) });
      queryClient.invalidateQueries({ queryKey: adminPackagesListKey });
      void audit({
        actionType: 'package_feature',
        description: `${featured ? 'Featured' : 'Unfeatured'} package "${title}"`,
        entityType: 'package',
        entityId: packageId,
        metadata: { featured },
      });
    },
  });
}
