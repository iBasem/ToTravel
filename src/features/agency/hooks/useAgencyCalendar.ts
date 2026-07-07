
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface CalendarBooking {
    id: string;
    booking_date: string;
    status: string;
    total_price: number;
    participants: number;
    package: {
        title: string;
    };
    traveler: {
        first_name: string;
        last_name: string;
    };
}

export function useAgencyCalendar() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookings, setBookings] = useState<CalendarBooking[]>([]);

    const fetchMonthBookings = useCallback(async (date: Date) => {
        if (!user) return;

        setLoading(true);
        setError(null);
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');

        try {
            // travel_agencies.id IS the auth user id, so packages.agency_id
            // can be matched against user.id directly (no agency lookup needed).
            const { data, error: fetchError } = await supabase
                .from('package_bookings')
                .select(`
          id,
          booking_date,
          status,
          total_price,
          participants,
          package:packages!inner (
            title,
            agency_id
          ),
          traveler:travelers (
            first_name,
            last_name
          )
        `)
                .eq('package.agency_id', user.id)
                .gte('booking_date', start)
                .lte('booking_date', end);

            if (fetchError) throw fetchError;

            const formattedData = (data || []).map((b: any) => ({
                id: b.id,
                booking_date: b.booking_date,
                status: b.status,
                total_price: b.total_price,
                participants: b.participants,
                package: {
                    title: b.package?.title || 'Unknown Package'
                },
                traveler: {
                    first_name: b.traveler?.first_name || 'Unknown',
                    last_name: b.traveler?.last_name || 'Traveler'
                }
            }));

            setBookings(formattedData);
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : (err as { message?: string })?.message || 'Unknown error';
            console.error('Error fetching calendar bookings:', message);
            setError(message);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        loading,
        error,
        bookings,
        fetchMonthBookings
    };
}
