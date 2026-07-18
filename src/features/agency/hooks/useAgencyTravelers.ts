import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { formatDate } from '@/lib/formatters';

export interface Traveler {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    totalBookings: number;
    lastTrip: string | null;
    lastTripDate: string | null;
}

async function fetchTravelers(
    userId: string,
    t: (key: string, fallback?: string) => string,
): Promise<Traveler[]> {
    // Bounded (audit AGY-28): aggregate from the 1000 most recent bookings.
    const { data, error } = await supabase
        .from('package_bookings')
        .select(`
            booking_date,
            traveler:travelers!inner (
              id,
              first_name,
              last_name,
              email,
              phone,
              avatar_url
            ),
            packages!inner (
              title
            )
          `)
        .eq('packages.agency_id', userId)
        .order('booking_date', { ascending: false })
        .limit(1000);

    if (error) throw error;

    const travelerMap = new Map<string, Traveler>();

    data?.forEach((booking) => {
        const travelerId = booking.traveler.id;

        if (!travelerMap.has(travelerId)) {
            travelerMap.set(travelerId, {
                id: travelerId,
                name: `${booking.traveler.first_name ?? ''} ${booking.traveler.last_name ?? ''}`.trim() || t('common.unknown', 'Unknown'),
                email: booking.traveler.email,
                phone: booking.traveler.phone,
                totalBookings: 0,
                lastTrip: null,
                lastTripDate: null,
            });
        }

        const traveler = travelerMap.get(travelerId)!;
        traveler.totalBookings += 1;

        // Ordered by date desc: the first sighting is the latest trip.
        if (!traveler.lastTrip) {
            traveler.lastTrip = `${booking.packages.title} - ${formatDate(booking.booking_date, 'PP')}`;
            traveler.lastTripDate = booking.booking_date;
        }
    });

    return Array.from(travelerMap.values());
}

export function useAgencyTravelers() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'travelers', userId],
        enabled: !!userId,
        queryFn: () => fetchTravelers(userId!, t),
    });

    return {
        travelers: query.data ?? [],
        loading: query.isPending,
        error: query.error
            ? (query.error instanceof Error ? query.error.message : String(query.error))
            : null,
    };
}
