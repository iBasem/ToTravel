import {
  format as dateFnsFormat,
  formatDistanceToNow,
  parseISO,
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";
import i18n from "@/i18n";

/**
 * Locale-aware formatting for the whole app.
 *
 * Policy decisions encoded here (see LOCALIZATION-AUDIT.md):
 * - Arabic uses Western digits (nu-latn) to match the digit convention
 *   already used across ar.json and regional fintech norms.
 * - Display currency is platform-wide, driven by VITE_PLATFORM_CURRENCY
 *   (USD | SAR | AED, defaults to SAR). Amounts are stored and displayed
 *   in this single currency — no conversion happens client-side. SAR is the
 *   default because all payments run through Moyasar in SAR; environments
 *   without the env var set (CI, a fresh Cloudflare build) must still render
 *   Saudi Riyal, not fall back to USD.
 */

export const SUPPORTED_CURRENCIES = ["USD", "SAR", "AED"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "SAR";

export function getPlatformCurrency(): CurrencyCode {
  const configured = (import.meta.env.VITE_PLATFORM_CURRENCY ?? DEFAULT_CURRENCY)
    .toString()
    .toUpperCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(configured)
    ? (configured as CurrencyCode)
    : DEFAULT_CURRENCY;
}

function isArabic(): boolean {
  return i18n.language?.startsWith("ar") ?? false;
}

/** BCP-47 tag for Intl APIs. nu-latn keeps Western digits in Arabic. */
function intlLocale(): string {
  return isArabic() ? "ar-SA-u-nu-latn" : "en-US";
}

function dateFnsLocale(): Locale {
  return isArabic() ? ar : enUS;
}

function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return parseISO(value);
  return new Date(value);
}

/** date-fns format() with the active UI language's locale. */
export function formatDate(
  value: Date | string | number,
  formatStr = "PP"
): string {
  return dateFnsFormat(toDate(value), formatStr, { locale: dateFnsLocale() });
}

/** "3 days ago" / "منذ 3 أيام" */
export function formatRelativeTime(value: Date | string | number): string {
  return formatDistanceToNow(toDate(value), {
    addSuffix: true,
    locale: dateFnsLocale(),
  });
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(intlLocale(), options).format(value);
}

export interface FormatCurrencyOptions {
  currency?: CurrencyCode;
  /** Whole amounts by default — prices on this platform have no cents. */
  maximumFractionDigits?: number;
}

export function formatCurrency(
  value: number,
  { currency, maximumFractionDigits = 0 }: FormatCurrencyOptions = {}
): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: currency ?? getPlatformCurrency(),
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

/** "12%" with locale-correct rendering. Input is 0–100, not 0–1. */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}
