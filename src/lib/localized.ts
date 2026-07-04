import i18n from "@/i18n";

/**
 * Pick the Arabic variant of a catalog field when the UI language is
 * Arabic and a translation exists, otherwise fall back to the base
 * (English) field. Works with the `_ar` sibling-column convention
 * (packages.title / packages.title_ar, itineraries.activities /
 * activities_ar, package_routes.name / name_ar, ...).
 */
export function pickLocalized<T>(
  row: object | null | undefined,
  field: string
): T | undefined {
  if (!row) return undefined;
  const rec = row as Record<string, unknown>;
  if (i18n.language?.startsWith("ar")) {
    const arValue = rec[`${field}_ar`];
    const present = Array.isArray(arValue)
      ? arValue.length > 0
      : typeof arValue === "string"
        ? arValue.trim() !== ""
        : arValue != null;
    if (present) return arValue as T;
  }
  return rec[field] as T;
}

/** Convenience for the common string case. */
export function localizedText(
  row: object | null | undefined,
  field: string
): string {
  return pickLocalized<string>(row, field) ?? "";
}
