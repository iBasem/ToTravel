import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Human-readable reference derived from a UUID. Uses the LAST 8 hex chars:
 * the tail is the discriminating part for both random v4 ids and the
 * deterministic seeded demo ids (a0000000-…-0009), whereas the first 8
 * chars collide across all seeded rows.
 */
export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(-8).toUpperCase()
}

/**
 * Display name for a person that may have no full name yet: falls back to
 * the email's local part, never to a raw email or a blank string. Accepts
 * either a profile-shaped object or a single "name or email" string (audit
 * logs store whichever was available at write time).
 */
export function displayName(
  source: string | { full_name?: string | null; email?: string | null } | null | undefined
): string {
  if (typeof source === "string") {
    return source.split("@")[0]?.trim() || "—"
  }
  const name = source?.full_name?.trim()
  if (name) return name
  const local = source?.email?.split("@")[0]?.trim()
  return local || "—"
}

/** Up-to-two-letter initials for avatar fallbacks, from a name or email. */
export function initials(nameOrEmail: string | null | undefined): string {
  const base = (nameOrEmail ?? "").split("@")[0].trim()
  if (!base) return "?"
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  const chars = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [base[0], base[1] ?? ""]
  return chars.join("").toUpperCase()
}
