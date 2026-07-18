import { useQuery } from '@tanstack/react-query';
import {
    format,
    parseISO,
    subDays,
    subMonths,
    startOfDay,
    startOfMonth,
    endOfMonth,
    isSameMonth,
} from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isRevenueBooking } from '@/features/agency/lib/revenue';

/**
 * Single consolidated data source for the agency Overview page. One fetch of
 * this agency's bookings, published packages and reviews; every widget's data
 * is derived in-memory so the page has a single loading/error state and no
 * per-widget query waterfall. All reads are tenant-scoped by agency_id (RLS
 * enforces this server-side; the client filters mirror it).
 */

export interface OverviewBooking {
    id: string;
    package_id: string;
    traveler_id: string;
    booking_date: string;
    participants: number;
    total_price: number;
    status: string;
    created_at: string;
    travelerName: string;
    packageTitle: string;
    destination: string;
    durationDays: number;
}

export interface OverviewPackage {
    id: string;
    title: string;
    destination: string;
    base_price: number;
    duration_days: number;
    duration_nights: number;
    created_at: string;
    imageUrl: string | null;
}

export interface RevenuePoint {
    label: string;
    revenue: number;
}

export interface ActivityItem {
    id: string;
    type: 'booking' | 'review' | 'cancelled';
    travelerName: string;
    packageTitle: string;
    rating?: number;
    at: string;
}

export interface Kpi {
    value: number;
    /** Percent change vs. the previous 30-day window; null when that window is empty. */
    delta: number | null;
}

export interface AgencyOverviewData {
    kpis: {
        bookings: Kpi;
        newCustomers: Kpi;
        earnings: Kpi;
    };
    revenueWeekly: RevenuePoint[];
    revenueMonthly: RevenuePoint[];
    trips: { completed: number; upcoming: number; cancelled: number; total: number };
    packages: OverviewPackage[];
    bookings: OverviewBooking[];
    upcomingTrips: OverviewBooking[];
    activity: ActivityItem[];
    hasAnyData: boolean;
}

const DAY_MS = 86_400_000;

function pctDelta(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

function derive(
    bookings: OverviewBooking[],
    packages: OverviewPackage[],
    reviews: { id: string; rating: number; created_at: string; travelerName: string; packageTitle: string }[],
): AgencyOverviewData {
    const now = Date.now();
    const win1 = now - 30 * DAY_MS; // last 30 days
    const win2 = now - 60 * DAY_MS; // prior 30 days
    // Shared revenue definition (AGY-22): confirmed + completed only.
    const active = bookings.filter(isRevenueBooking);

    // KPI: bookings created per window
    const bookingsLast30 = bookings.filter((b) => new Date(b.created_at).getTime() >= win1).length;
    const bookingsPrev30 = bookings.filter((b) => {
        const t = new Date(b.created_at).getTime();
        return t >= win2 && t < win1;
    }).length;

    // KPI: earnings (non-cancelled) created per window
    const earnLast30 = active
        .filter((b) => new Date(b.created_at).getTime() >= win1)
        .reduce((s, b) => s + Number(b.total_price), 0);
    const earnPrev30 = active
        .filter((b) => {
            const t = new Date(b.created_at).getTime();
            return t >= win2 && t < win1;
        })
        .reduce((s, b) => s + Number(b.total_price), 0);
    const totalEarnings = active.reduce((s, b) => s + Number(b.total_price), 0);

    // KPI: truly-new customers (traveler's first booking falls in the window)
    const firstSeen = new Map<string, number>();
    for (const b of bookings) {
        const t = new Date(b.created_at).getTime();
        const prev = firstSeen.get(b.traveler_id);
        if (prev === undefined || t < prev) firstSeen.set(b.traveler_id, t);
    }
    let newLast30 = 0;
    let newPrev30 = 0;
    for (const t of firstSeen.values()) {
        if (t >= win1) newLast30 += 1;
        else if (t >= win2) newPrev30 += 1;
    }

    // Revenue series by travel date (booking_date), non-cancelled
    const priceOnDay = (isoDay: string) =>
        active.filter((b) => b.booking_date === isoDay).reduce((s, b) => s + Number(b.total_price), 0);

    const today = startOfDay(new Date());
    const revenueWeekly: RevenuePoint[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        revenueWeekly.push({ label: format(d, 'EEE'), revenue: priceOnDay(format(d, 'yyyy-MM-dd')) });
    }

    const revenueMonthly: RevenuePoint[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(startOfMonth(today), i);
        const from = startOfMonth(d);
        const to = endOfMonth(d);
        const revenue = active
            .filter((b) => {
                const bd = parseISO(b.booking_date);
                return bd >= from && bd <= to;
            })
            .reduce((s, b) => s + Number(b.total_price), 0);
        revenueMonthly.push({ label: format(d, 'MMM'), revenue });
    }

    // Trips progress
    const trips = {
        completed: bookings.filter((b) => b.status === 'completed').length,
        upcoming: bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
        total: bookings.length,
    };

    // Upcoming trips: future travel date, confirmed first then by date
    const todayIso = format(today, 'yyyy-MM-dd');
    const upcomingTrips = bookings
        .filter((b) => b.booking_date >= todayIso && (b.status === 'confirmed' || b.status === 'pending'))
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === 'confirmed' ? -1 : 1;
            return a.booking_date.localeCompare(b.booking_date);
        })
        .slice(0, 4);

    // Activity feed: bookings + cancellations + reviews merged, newest first
    const activity: ActivityItem[] = [
        ...bookings.map((b) => ({
            id: `b-${b.id}`,
            type: (b.status === 'cancelled' ? 'cancelled' : 'booking') as ActivityItem['type'],
            travelerName: b.travelerName,
            packageTitle: b.packageTitle,
            at: b.created_at,
        })),
        ...reviews.map((r) => ({
            id: `r-${r.id}`,
            type: 'review' as const,
            travelerName: r.travelerName,
            packageTitle: r.packageTitle,
            rating: r.rating,
            at: r.created_at,
        })),
    ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 6);

    return {
        kpis: {
            bookings: { value: bookings.length, delta: pctDelta(bookingsLast30, bookingsPrev30) },
            newCustomers: { value: newLast30, delta: pctDelta(newLast30, newPrev30) },
            earnings: { value: totalEarnings, delta: pctDelta(earnLast30, earnPrev30) },
        },
        revenueWeekly,
        revenueMonthly,
        trips,
        packages,
        bookings,
        upcomingTrips,
        activity,
        hasAnyData: bookings.length > 0 || packages.length > 0,
    };
}

async function fetchOverview(userId: string): Promise<AgencyOverviewData> {
    const [bookingsRes, packagesRes, reviewsRes] = await Promise.all([
                supabase
                    .from('package_bookings')
                    .select(`
                        id, package_id, traveler_id, booking_date, participants, total_price, status, created_at,
                        travelers ( first_name, last_name ),
                        packages!inner ( title, destination, duration_days, agency_id )
                    `)
                    .eq('packages.agency_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('packages')
                    .select(`
                        id, title, destination, base_price, duration_days, duration_nights, status, created_at,
                        package_media ( file_path, is_primary, display_order )
                    `)
                    .eq('agency_id', userId)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('reviews')
                    .select(`
                        id, rating, created_at,
                        traveler:travelers ( first_name, last_name ),
                        package:packages!inner ( title, agency_id )
                    `)
                    .eq('package.agency_id', userId)
                    .order('created_at', { ascending: false }),
            ]);

            if (bookingsRes.error) throw bookingsRes.error;
            if (packagesRes.error) throw packagesRes.error;
            if (reviewsRes.error) throw reviewsRes.error;

            const bookings: OverviewBooking[] = (bookingsRes.data || []).map((b) => ({
                id: b.id,
                package_id: b.package_id,
                traveler_id: b.traveler_id,
                booking_date: b.booking_date,
                participants: b.participants ?? 1,
                total_price: Number(b.total_price),
                status: b.status ?? 'pending',
                created_at: b.created_at,
                travelerName: b.travelers
                    ? `${b.travelers.first_name ?? ''} ${b.travelers.last_name ?? ''}`.trim()
                    : '',
                packageTitle: b.packages?.title ?? '',
                destination: b.packages?.destination ?? '',
                durationDays: b.packages?.duration_days ?? 0,
            }));

            const packages: OverviewPackage[] = (packagesRes.data || []).map((p) => {
                const media = (p.package_media || []) as { file_path: string; is_primary: boolean; display_order: number }[];
                const primary = media.find((m) => m.is_primary) ?? [...media].sort((a, b) => a.display_order - b.display_order)[0];
                return {
                    id: p.id,
                    title: p.title,
                    destination: p.destination,
                    base_price: Number(p.base_price),
                    duration_days: p.duration_days,
                    duration_nights: p.duration_nights,
                    created_at: p.created_at,
                    imageUrl: primary?.file_path ?? null,
                };
            });

            const reviews = (reviewsRes.data || []).map((r) => ({
                id: r.id,
                rating: r.rating,
                created_at: r.created_at,
                travelerName: r.traveler
                    ? `${r.traveler.first_name ?? ''} ${r.traveler.last_name ?? ''}`.trim()
                    : '',
                packageTitle: r.package?.title ?? '',
            }));

            return derive(bookings, packages, reviews);
}

export function useAgencyOverview() {
    const { user } = useAuth();
    const userId = user?.id;

    const query = useQuery({
        queryKey: ['agency', 'overview', userId],
        enabled: !!userId,
        queryFn: () => fetchOverview(userId!),
    });

    return {
        data: query.data ?? null,
        loading: query.isPending,
        error: query.error ? (query.error instanceof Error ? query.error.message : String(query.error)) : null,
        refetch: query.refetch,
    };
}

/** Bookings that fall on a given month, for the mini-calendar. */
export function bookingsInMonth(bookings: OverviewBooking[], month: Date) {
    return bookings.filter((b) => isSameMonth(parseISO(b.booking_date), month));
}
