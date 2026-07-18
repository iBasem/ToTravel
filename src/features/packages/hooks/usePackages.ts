import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Package = Database['public']['Tables']['packages']['Row'];
type PackageUpdate = Database['public']['Tables']['packages']['Update'];
type Itinerary = Database['public']['Tables']['itineraries']['Row'];
type PackageMedia = Database['public']['Tables']['package_media']['Row'];

export interface PackageWithDetails extends Package {
  itineraries?: Itinerary[];
  package_media?: PackageMedia[];
}

// React Query since wave 4 (REG-11): package CRUD previously refetched only
// its own local state, leaving the Dashboard showcase and the Deals dropdown
// stale. Mutations invalidate the whole ['agency'] namespace, mirroring
// useBookings.
export function usePackages() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const role = profile?.role;

  const query = useQuery({
    queryKey: ['agency', 'packages', userId, role],
    enabled: !!userId,
    queryFn: async (): Promise<PackageWithDetails[]> => {
      let q = supabase
        .from('packages')
        .select(`
          *,
          itineraries!itineraries_package_id_fkey (*),
          package_media!package_media_package_id_fkey (*)
        `)
        .order('created_at', { ascending: false });

      // Agencies see their own packages; everyone else, published only.
      if (role === 'agency') {
        q = q.eq('agency_id', userId!);
      } else {
        q = q.eq('status', 'published');
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agency'] });

  const updatePackage = async (packageId: string, updates: PackageUpdate) => {
    if (!user || profile?.role !== 'agency') {
      throw new Error('Only agencies can update packages');
    }
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', packageId)
      .eq('agency_id', user.id)
      .select()
      .single();
    // Rethrow the ORIGINAL PostgrestError (REG-4): wrapping it in `new Error`
    // stripped `.code`, killing the FK-aware delete/update messages.
    if (error) throw error;
    await invalidate();
    return data;
  };

  const deletePackage = async (packageId: string) => {
    if (!user || profile?.role !== 'agency') {
      throw new Error('Only agencies can delete packages');
    }
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId)
      .eq('agency_id', user.id);
    if (error) throw error;
    await invalidate();
  };

  const uploadPackageMedia = async (packageId: string, file: File) => {
    if (!user) {
      throw new Error('User must be authenticated to upload media');
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${packageId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('package-media')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('package-media')
      .getPublicUrl(filePath);

    const { data, error: dbError } = await supabase
      .from('package_media')
      .insert({
        package_id: packageId,
        media_type: file.type.startsWith('image/') ? 'image' : 'video',
        file_path: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();
    if (dbError) throw dbError;
    await invalidate();
    return data;
  };

  return {
    packages: query.data ?? [],
    loading: query.isPending,
    error: query.error
      ? (query.error instanceof Error ? query.error.message : String(query.error))
      : null,
    updatePackage,
    deletePackage,
    uploadPackageMedia,
    refetch: query.refetch,
  };
}
