import { useState, useEffect } from 'react';
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
}

export function useAgencyTravelers() {
    const [travelers, setTravelers] = useState<Traveler[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchTravelers = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch bookings for this agency's packages, including traveler info
                const { data, error } = await supabase
                    .from('package_bookings')
                    .select(`
            booking_date,
            traveler:travelers!inner (
              id,
              first_name,
              last_name,
              phone,
              avatar_url
            ),
            packages!inner (
              title
            )
          `)
                    .eq('packages.agency_id', user.id)
                    .order('booking_date', { ascending: false });

                if (error) throw error;

                // Aggregate data by traveler
                const travelerMap = new Map<string, Traveler>();

                data?.forEach((booking) => {
                    const travelerId = booking.traveler.id;

                    if (!travelerMap.has(travelerId)) {
                        travelerMap.set(travelerId, {
                            id: travelerId,
                            name: `${booking.traveler.first_name ?? ''} ${booking.traveler.last_name ?? ''}`.trim() || t('common.unknown', 'Unknown'),
                            email: t('agencyDashboard.privateEmail', 'Private'), // Email is often not directly exposed in public profile unless verified
                            phone: booking.traveler.phone,
                            totalBookings: 0,
                            lastTrip: null
                        });
                    }

                    const traveler = travelerMap.get(travelerId)!;
                    traveler.totalBookings += 1;

                    // Since we ordered by date desc, the first time we see a traveler, it's their latest trip
                    if (!traveler.lastTrip) {
                        traveler.lastTrip = `${booking.packages.title} - ${formatDate(booking.booking_date, 'PP')}`;
                    }
                });

                setTravelers(Array.from(travelerMap.values()));

            } catch (err) {
                console.error('Error fetching agency travelers:', err);
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchTravelers();
    }, [user]);

    return { travelers, loading, error };
}
