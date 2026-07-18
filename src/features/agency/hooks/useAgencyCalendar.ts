
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";

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

async function fetchMonth(
    userId: string,
    monthKey: string,
    t: (key: string, fallback?: string) => string,
): Promise<CalendarBooking[]> {
    const monthStart = startOfMonth(parseISO(`${monthKey}-01`));
    const start = format(monthStart, "yyyy-MM-dd");
    const end = format(endOfMonth(monthStart), "yyyy-MM-dd");

    // travel_agencies.id IS the auth user id, so packages.agency_id
    // can be matched against user.id directly (no agency lookup needed).
    const { data, error } = await supabase
        .from("package_bookings")
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
        .eq("package.agency_id", userId)
        .gte("booking_date", start)
        .lte("booking_date", end);

    if (error) throw error;

    return (data || []).map((b) => ({
        id: b.id,
        booking_date: b.booking_date,
        status: b.status,
        total_price: b.total_price,
        participants: b.participants,
        package: {
            title: b.package?.title || t("common.unknownPackage"),
        },
        traveler: {
            first_name: b.traveler?.first_name || t("common.unknown", "Unknown"),
            last_name: b.traveler?.last_name || t("common.traveler"),
        },
    }));
}

// React Query keyed by (user, month): month switches hit the cache, and an
// in-flight response for a previously-viewed month can never clobber the
// current one (audit AGY-26).
export function useAgencyCalendar() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const userId = user?.id;
    const [monthKey, setMonthKey] = useState<string | null>(null);

    const query = useQuery({
        queryKey: ["agency", "calendar", userId, monthKey],
        enabled: !!userId && !!monthKey,
        queryFn: () => fetchMonth(userId!, monthKey!, t),
    });

    const fetchMonthBookings = useCallback((date: Date) => {
        setMonthKey(format(date, "yyyy-MM"));
    }, []);

    return {
        loading: !!monthKey && query.isPending,
        error: query.error
            ? (query.error instanceof Error ? query.error.message : String(query.error))
            : null,
        bookings: query.data ?? [],
        fetchMonthBookings,
        // Error-state Retry must call this: fetchMonthBookings(sameMonth) is a
        // no-op state update under React Query (REG-6).
        refetch: query.refetch,
    };
}
