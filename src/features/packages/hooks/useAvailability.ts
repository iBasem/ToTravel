import { useState, useEffect, useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Departure, MonthlyAvailability } from '@/features/packages/types';

interface UseAvailabilityOptions {
    packageId: string;
    availableFrom?: string;
    availableTo?: string;
    durationDays: number;
    basePrice: number;
    maxParticipants?: number;
}

/**
 * Reads REAL departures from `package_departures` and derives seats-remaining
 * from bookings at read time (no denormalized counter). Returns no departures
 * (hasAvailability=false) when none are scheduled — no fabricated dates,
 * seats, or discounts (WIZ-11, replacing the former random generation).
 */
export function useAvailability({
    packageId,
    durationDays,
    basePrice,
}: UseAvailabilityOptions) {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        if (!packageId) {
            setDepartures([]);
            setLoading(false);
            return;
        }

        (async () => {
            setLoading(true);
            const today = format(new Date(), 'yyyy-MM-dd');

            const [{ data: deps }, { data: bookings }] = await Promise.all([
                supabase
                    .from('package_departures')
                    .select('id, departure_date, return_date, total_seats, price_override, status')
                    .eq('package_id', packageId)
                    .eq('status', 'scheduled')
                    .gte('departure_date', today)
                    .order('departure_date', { ascending: true }),
                supabase
                    .from('package_bookings')
                    .select('booking_date, participants, status')
                    .eq('package_id', packageId),
            ]);

            // Seats already booked per departure date (cancelled don't count).
            const bookedByDate = new Map<string, number>();
            (bookings || []).forEach((b) => {
                if (b.status === 'cancelled') return;
                bookedByDate.set(b.booking_date, (bookedByDate.get(b.booking_date) || 0) + (b.participants || 0));
            });

            const mapped: Departure[] = (deps || []).map((d) => {
                const booked = bookedByDate.get(d.departure_date) || 0;
                const seatsRemaining = Math.max(0, d.total_seats - booked);
                const end = d.return_date || format(addDays(parseISO(d.departure_date), durationDays), 'yyyy-MM-dd');
                // A price_override below the base price is a promotional fare;
                // above (peak pricing) it simply replaces the base price.
                const override = d.price_override != null ? Number(d.price_override) : null;
                const isDiscount = override != null && override < basePrice;
                return {
                    id: d.id,
                    tour_id: packageId,
                    start_date: d.departure_date,
                    end_date: end,
                    seats_remaining: seatsRemaining,
                    price: isDiscount ? basePrice : (override ?? basePrice),
                    discount_price: isDiscount ? override : null,
                    status: seatsRemaining === 0 ? 'sold_out' : seatsRemaining <= 3 ? 'limited' : 'available',
                };
            });

            if (active) {
                setDepartures(mapped);
                setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [packageId, durationDays, basePrice]);

    // Monthly summaries from the real departures.
    const monthlyAvailability = useMemo((): MonthlyAvailability[] => {
        if (departures.length === 0) return [];

        const monthMap = new Map<string, Departure[]>();
        departures.forEach((dep) => {
            const monthKey = dep.start_date.substring(0, 7); // "YYYY-MM"
            if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
            monthMap.get(monthKey)!.push(dep);
        });

        return Array.from(monthMap.entries())
            .map(([monthStr, monthDepartures]) => {
                const prices = monthDepartures.map((d) => d.discount_price || d.price);
                return {
                    month: monthStr,
                    monthLabel: format(parseISO(`${monthStr}-01`), 'MMMM yyyy'),
                    startingPrice: Math.min(...prices),
                    departureCount: monthDepartures.length,
                };
            })
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [departures]);

    const filteredDepartures = useMemo(() => {
        if (!selectedMonth) return departures;
        return departures.filter((dep) => dep.start_date.startsWith(selectedMonth));
    }, [departures, selectedMonth]);

    return {
        departures,
        filteredDepartures,
        monthlyAvailability,
        selectedMonth,
        setSelectedMonth,
        hasAvailability: departures.length > 0,
        loading,
    };
}
