import { describe, expect, it } from 'vitest';
import { isRevenueBooking, totalRevenue } from './revenue';

describe('revenue definition (AGY-22)', () => {
    it('counts confirmed and completed only', () => {
        expect(isRevenueBooking({ status: 'confirmed' })).toBe(true);
        expect(isRevenueBooking({ status: 'completed' })).toBe(true);
        expect(isRevenueBooking({ status: 'pending' })).toBe(false);
        expect(isRevenueBooking({ status: 'cancelled' })).toBe(false);
        expect(isRevenueBooking({ status: null })).toBe(false);
    });

    it('sums prices across revenue bookings, coercing strings and nulls', () => {
        expect(
            totalRevenue([
                { status: 'confirmed', total_price: '100.50' },
                { status: 'completed', total_price: 200 },
                { status: 'pending', total_price: 999 },
                { status: 'cancelled', total_price: 999 },
                { status: 'confirmed', total_price: null },
            ]),
        ).toBeCloseTo(300.5);
    });
});
