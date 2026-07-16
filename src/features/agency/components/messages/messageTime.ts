import { parseISO, isToday, isYesterday, differenceInCalendarDays } from "date-fns";
import type { TFunction } from "i18next";
import { formatDate, formatRelativeTime } from "@/lib/formatters";

/** Messaging-style list timestamp: today → time, yesterday → label, this week → relative, older → date. */
export function conversationTime(dateStr: string, t: TFunction): string {
    const d = parseISO(dateStr);
    if (isToday(d)) return formatDate(d, "p");
    if (isYesterday(d)) return t("common.yesterday", "Yesterday");
    if (differenceInCalendarDays(new Date(), d) < 7) return formatRelativeTime(d);
    return formatDate(d, "P");
}

/** Centered day-separator label inside a thread. */
export function daySeparator(dateStr: string, t: TFunction): string {
    const d = parseISO(dateStr);
    if (isToday(d)) return t("common.today", "Today");
    if (isYesterday(d)) return t("common.yesterday", "Yesterday");
    return formatDate(d, "PP");
}

/** Stable YYYY-MM-DD key for grouping messages by calendar day. */
export function dayKey(dateStr: string): string {
    return formatDate(parseISO(dateStr), "yyyy-MM-dd");
}
