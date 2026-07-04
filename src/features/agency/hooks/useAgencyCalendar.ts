
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { toast } from "sonner";

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
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<CalendarBooking[]>([]);

    const fetchMonthBookings = useCallback(async (date: Date) => {
        if (!user) return;

        setLoading(true);
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');

        try {
            // We need to fetch bookings for packages owned by this agency
            // 1. Get agency ID for current user
            const { data: agencyData, error: agencyError } = await supabase
                .from('travel_agencies')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (agencyError || !agencyData) {
                console.error('Error fetching generic agency data', agencyError);
                return;
            }

            // 2. Fetch bookings for packages owned by this agency
            const { data, error } = await supabase
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
                .eq('package.agency_id', agencyData.id)
                .gte('booking_date', start)
                .lte('booking_date', end);

            if (error) throw error;

            // Transform to match interface (flattening nested package/traveler if needed, but the select shape matches mostly)
            // We rely on Supabase returning the shape requested.
            // Note: !inner on package join ensures we only get bookings for *this* agency's packages.

            const formattedData = (data || []).map((b: any) => ({
                id: b.id,
                booking_date: b.booking_date,
                status: b.status,
                total_price: b.total_price,
                participants: b.participants,
                package: {
                    title: b.package?.title || t('common.unknownPackage')
                },
                traveler: {
                    first_name: b.traveler?.first_name || t('common.unknown', 'Unknown'),
                    last_name: b.traveler?.last_name || t('common.traveler')
                }
            }));

            setBookings(formattedData);
        } catch (error) {
            console.error('Error fetching calendar bookings:', error);
            toast.error(t('toasts.calendarLoadFailed', 'Failed to load calendar bookings'));
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        loading,
        bookings,
        fetchMonthBookings
    };
}
