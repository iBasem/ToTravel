import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type TravelerRow = Database['public']['Tables']['travelers']['Row'];

export interface TravelerPreferences {
  address?: string;
  bio?: string;
  emergency_relationship?: string;
  notifications?: {
    emailBookings?: boolean;
    emailPromotions?: boolean;
    smsReminders?: boolean;
    pushNotifications?: boolean;
  };
  privacy?: {
    profileVisible?: boolean;
    showTravelHistory?: boolean;
    allowMessages?: boolean;
  };
}

export interface TravelerProfileUpdate {
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  preferences: TravelerPreferences;
}

/** Full traveler profile row plus travel stats computed from real bookings. */
export function useTravelerProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['traveler-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('travelers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const statsQuery = useQuery({
    queryKey: ['traveler-profile-stats', userId],
    queryFn: async () => {
      if (!userId) return { completedTours: 0, countriesVisited: 0 };
      const { data, error } = await supabase
        .from('package_bookings')
        .select('status, packages ( destination )')
        .eq('traveler_id', userId)
        .eq('status', 'completed');
      if (error) throw error;
      const rows = data ?? [];
      const countries = new Set(
        rows
          .map(b => (b.packages as { destination?: string } | null)?.destination)
          .filter(Boolean)
      );
      return { completedTours: rows.length, countriesVisited: countries.size };
    },
    enabled: !!userId,
  });

  // Uploads the image to avatars/{uid}/ and points travelers.avatar_url at it.
  const updateAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('Not signed in');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error } = await supabase
        .from('travelers')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (error) throw error;
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveler-profile', userId] });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (update: TravelerProfileUpdate) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('travelers')
        .update({ ...update, preferences: update.preferences as Database['public']['Tables']['travelers']['Update']['preferences'] })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveler-profile', userId] });
    },
  });

  return {
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    stats: statsQuery.data ?? { completedTours: 0, countriesVisited: 0 },
    updateProfile,
    updateAvatar,
  };
}
