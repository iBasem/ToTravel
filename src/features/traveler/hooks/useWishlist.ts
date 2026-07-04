
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

export type WishlistItem = {
    id: string;
    package_id: string;
    created_at: string;
    package: {
        id: string;
        title: string;
        title_ar?: string | null;
        base_price: number;
        destination: string;
        destination_ar?: string | null;
        duration_days: number;
        max_participants: number | null;
        difficulty_level: string | null;
        package_media: {
            file_path: string;
            is_primary: boolean;
        }[];
    };
};

export function useWishlist() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

    const fetchWishlist = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('wishlist')
                .select(`
          id,
          package_id,
          created_at,
          package:packages (
            id,
            title,
            title_ar,
            base_price,
            destination,
            destination_ar,
            duration_days,
            max_participants,
            difficulty_level,
            package_media (
              file_path,
              is_primary
            )
          )
        `)
                .eq('traveler_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            // Safe cast since the join structure matches but TS might not infer deep nested types perfectly immediately
            const typedData = data as unknown as WishlistItem[];
            setWishlist(typedData || []);
            setWishlistIds(new Set(typedData?.map(item => item.package_id) || []));
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            toast.error(t('toasts.wishlistLoadFailed'));
        } finally {
            setLoading(false);
        }
    }, [user, t]);

    const toggleWishlist = async (packageId: string) => {
        if (!user) {
            toast.error(t('toasts.signInToWishlist'));
            return;
        }

        const isInWishlist = wishlistIds.has(packageId);

        // Optimistic update
        setWishlistIds(prev => {
            const next = new Set(prev);
            if (isInWishlist) {
                next.delete(packageId);
            } else {
                next.add(packageId);
            }
            return next;
        });

        try {
            if (isInWishlist) {
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('traveler_id', user.id)
                    .eq('package_id', packageId);

                if (error) throw error;
                toast.success(t('toasts.wishlistRemoved'));
            } else {
                const { error } = await supabase
                    .from('wishlist')
                    .insert({
                        traveler_id: user.id,
                        package_id: packageId
                    });

                if (error) throw error;
                toast.success(t('toasts.wishlistAdded'));
            }

            // Refresh to ensure sync
            fetchWishlist();
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            toast.error(t('toasts.wishlistUpdateFailed'));

            // Revert optimistic update
            setWishlistIds(prev => {
                const next = new Set(prev);
                if (isInWishlist) {
                    next.add(packageId);
                } else {
                    next.delete(packageId);
                }
                return next;
            });
        }
    };

    return {
        wishlist,
        wishlistIds,
        loading,
        fetchWishlist,
        toggleWishlist
    };
}
