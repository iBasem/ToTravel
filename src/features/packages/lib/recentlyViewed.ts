// Tracks the packages a visitor recently opened, per browser, in localStorage.
// PackageDetails records a view; the traveler dashboard reads the ids and
// hydrates them from Supabase (so the rendered data is always live).

const STORAGE_KEY = 'totravel.recentlyViewedPackages';
const MAX_ITEMS = 8;

export function recordPackageView(packageId: string): void {
    try {
        const ids = getRecentlyViewedIds().filter((id) => id !== packageId);
        ids.unshift(packageId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)));
    } catch {
        // Storage unavailable (private mode / quota) — viewing history is best-effort.
    }
}

export function getRecentlyViewedIds(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
        return [];
    }
}
