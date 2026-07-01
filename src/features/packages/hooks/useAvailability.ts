import { useState, useMemo } from 'react';
import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import type { Departure, MonthlyAvailability } from '@/features/packages/types';

interface UseAvailabilityOptions {
    packageId: string;
    availableFrom: string;
    availableTo: string;
    durationDays: number;
    basePrice: number;
    maxParticipants: number;
}

/**
 * Hook to generate departure/availability data from package date ranges
 * Since departures table doesn't exist, we generate possible departures
 * based on the package's available_from and available_to fields
 */
export function useAvailability({
    packageId,
    availableFrom,
    availableTo,
    durationDays,
    basePrice,
    maxParticipants,
}: UseAvailabilityOptions) {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    // Generate departures from the availability window
    const departures = useMemo((): Departure[] => {
        const today = new Date();

        // Parse provided dates or use fallback (next 6 months from today)
        let startDate: Date;
        let endDate: Date;

        if (availableFrom && availableTo) {
            const parsedStart = parseISO(availableFrom);
            const parsedEnd = parseISO(availableTo);

            // If end date is in the past, use fallback dates
            if (isBefore(parsedEnd, today)) {
                startDate = addDays(today, 7); // Start from next week
                endDate = addDays(today, 180); // 6 months from now
            } else {
                // Use max of parsed start or today
                startDate = isAfter(parsedStart, today) ? parsedStart : addDays(today, 1);
                endDate = parsedEnd;
            }
        } else {
            // No dates provided - generate 6 months of availability
            startDate = addDays(today, 7);
            endDate = addDays(today, 180);
        }

        // Generate weekly departures within the availability window
        const generatedDepartures: Departure[] = [];
        let currentStart = startDate;
        let idCounter = 1;

        while (isBefore(currentStart, endDate) && generatedDepartures.length < 52) { // Max 52 departures (1 year)
            const departureEnd = addDays(currentStart, durationDays);

            // Simulate varying seat availability and discounts
            const seatsBase = maxParticipants;
            // Use a seeded random based on date for consistent results
            const seed = currentStart.getTime() % 100;
            const randomSeats = Math.max(1, Math.floor((seed / 100) * seatsBase));
            const hasDiscount = seed > 70; // 30% chance of discount

            generatedDepartures.push({
                id: `${packageId}-dep-${idCounter}`,
                tour_id: packageId,
                start_date: format(currentStart, 'yyyy-MM-dd'),
                end_date: format(departureEnd, 'yyyy-MM-dd'),
                seats_remaining: randomSeats,
                price: basePrice,
                discount_price: hasDiscount ? Math.round(basePrice * 0.85) : null,
                status: randomSeats <= 3 ? 'limited' : randomSeats === 0 ? 'sold_out' : 'available',
            });
            idCounter++;

            // Move to next week (7 days)
            currentStart = addDays(currentStart, 7);
        }

        return generatedDepartures;
    }, [packageId, availableFrom, availableTo, durationDays, basePrice, maxParticipants]);


    // Calculate monthly availability summaries from generated departures
    const monthlyAvailability = useMemo((): MonthlyAvailability[] => {
        if (departures.length === 0) return [];

        // Group departures by month
        const monthMap = new Map<string, Departure[]>();

        departures.forEach(dep => {
            const monthKey = dep.start_date.substring(0, 7); // "YYYY-MM"
            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, []);
            }
            monthMap.get(monthKey)!.push(dep);
        });

        // Convert to monthly availability array
        return Array.from(monthMap.entries())
            .map(([monthStr, monthDepartures]) => {
                const prices = monthDepartures.map(d => d.discount_price || d.price);
                const startingPrice = Math.min(...prices);

                return {
                    month: monthStr,
                    monthLabel: format(parseISO(`${monthStr}-01`), 'MMMM yyyy'),
                    startingPrice,
                    departureCount: monthDepartures.length,
                };
            })
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [departures]);

    // Filter departures by selected month
    const filteredDepartures = useMemo(() => {
        if (!selectedMonth) return departures;

        return departures.filter(dep => {
            return dep.start_date.startsWith(selectedMonth);
        });
    }, [departures, selectedMonth]);

    return {
        departures,
        filteredDepartures,
        monthlyAvailability,
        selectedMonth,
        setSelectedMonth,
        hasAvailability: departures.length > 0,
    };
}
