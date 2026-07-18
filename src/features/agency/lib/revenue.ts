// Single revenue definition for the agency portal (audit AGY-22).
// A booking counts toward revenue once it is confirmed or completed:
// pending bookings are unpaid intent, cancelled bookings never count.
// Dashboard KPIs/charts and the Bookings page must all use this helper so
// the same agency never sees two different revenue totals.

export const REVENUE_STATUSES = ['confirmed', 'completed'] as const;

export function isRevenueBooking(b: { status: string | null }): boolean {
    return (REVENUE_STATUSES as readonly string[]).includes(b.status ?? 'pending');
}

export function totalRevenue(
    bookings: Array<{ status: string | null; total_price: number | string | null }>,
): number {
    return bookings
        .filter(isRevenueBooking)
        .reduce((sum, b) => sum + Number(b.total_price ?? 0), 0);
}
