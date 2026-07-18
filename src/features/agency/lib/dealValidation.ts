// Deal form validation + derived display status (audit AGY-23/24/50).
// Pure functions so they are unit-testable; the page maps returned keys to
// agencyDashboard.* i18n messages.

export interface DealFormValues {
    title: string;
    discount_percentage: number;
    start_date: string;
    end_date: string;
    package_id: string;
}

/** Returns the agencyDashboard.* key of the first problem, or null when valid. */
export function validateDealForm(form: DealFormValues): string | null {
    if (!form.title.trim()) return 'dealTitleRequired';
    if (!form.package_id) return 'dealPackageRequired';
    if (!Number.isFinite(form.discount_percentage)
        || form.discount_percentage < 1
        || form.discount_percentage > 90) return 'dealDiscountRange';
    if (!form.start_date || !form.end_date) return 'dealDatesRequired';
    if (form.end_date < form.start_date) return 'dealDateOrder';
    return null;
}

/**
 * Display status derived from dates at render time: the stored status column
 * is frozen at creation (nothing flips scheduled→active or active→expired),
 * so the UI derives it. 'paused' is an explicit stored state and wins.
 * todayIso must be the LOCAL calendar date (yyyy-MM-dd), not UTC.
 */
export function derivedDealStatus(
    deal: { status: string; start_date: string; end_date: string },
    todayIso: string,
): 'paused' | 'expired' | 'scheduled' | 'active' {
    if (deal.status === 'paused') return 'paused';
    if (deal.end_date < todayIso) return 'expired';
    if (deal.start_date > todayIso) return 'scheduled';
    return 'active';
}
