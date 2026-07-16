import type { TFunction } from "i18next";

/**
 * Package lifecycle badge — shared by the list rows and the detail hero so the
 * status vocabulary stays identical across the explorer. Colors come from the
 * semantic status palette; both light and dark variants are provided.
 */
export function getStatusBadge(status: string | null, t: TFunction) {
    switch (status) {
        case "published":
            return {
                label: t("agencyDashboard.published"),
                className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
            };
        case "pending":
            return {
                label: t("agencyDashboard.pendingReview", "Pending review"),
                className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
            };
        case "archived":
            return {
                label: t("agencyDashboard.archived", "Archived"),
                className: "bg-muted text-muted-foreground border-border",
            };
        case "suspended":
            return {
                label: t("agencyDashboard.suspended", "Suspended"),
                className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
            };
        default:
            return {
                label: t("agencyDashboard.draft"),
                className: "bg-muted text-muted-foreground border-border",
            };
    }
}
