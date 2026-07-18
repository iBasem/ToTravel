# Agency Portal Regression Sweep — 2026-07-18

Follow-up to [agency-portal-audit-2026-07-18.md](agency-portal-audit-2026-07-18.md) after all three fix waves landed (commits `a7d3131..100eb2a`, pushed to origin/develop). Method: the same four parallel auditors (agency frontend, packages pipeline, backend/migrations, cross-cutting) re-run against current code with a verify-then-hunt mandate, plus live Supabase advisors. Every Critical/High claim was re-checked against the migration SQL.

---

## 1. Verdict

**The waves held.** Of the 45 fixes the sweep could verify, **41 are confirmed HELD**, both deferred items are cleanly deferred, and no security fix regressed — cross-tenant isolation, the moderation guards, the transition map, and the storage scoping all survive as written. The five architectural gaps (notifications, audit trail, finance visibility, error surfaces, tests) are substantially closed.

The sweep earned its keep, though: it found **2 broken fixes, 1 genuine wave-introduced regression, 1 new High-severity hole in a recreated guard, and 2 audit findings that silently fell out of the wave plan** (AGY-15, AGY-16 — no commit ever claimed them). Everything below is small; a short Wave 4 clears it.

## 2. Verification matrix (consolidated)

| Verdict | Items |
|---|---|
| **HELD** (41) | AGY-1, 2, 3, 5, 6 (client+server), 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19, 22, 23, 24, 25, 26*, 27, 29, 32, 33, 35 (indexes), 38, 40, 41, 44, 45*, 46, 47, 48*, 49, 50, 51 + wave-2/3 additions (decline/complete, status UX, notifications RLS/i18n, audit trail, payments policy, guards tests) |
| **BROKEN FIX** (2) | AGY-20 (FK toast dead — error code stripped), AGY-28 (overview still unbounded; all other hooks bounded) |
| **REGRESSION** (2) | Calendar Retry no-op after RQ migration; StaysStep eager storage deletion (breaks live packages on cancel/duplicate) |
| **NEVER CLAIMED** (2) | AGY-15 (stale `day_numbers`), AGY-16 (published-save validates Basics only) — fell out of the wave plan |
| **DEFERRED-OK** (2) | AGY-37 (inclusions flatten round-trip consistent), AGY-39 (travelMode cleanly hardcoded) |
| **NOT ADDRESSED, accepted** (2) | AGY-34 (seed GUC session scope), AGY-36 remainder (RPC exposure verified intentional; leaked-password toggle documented) |

\* AGY-26 held but gained the Retry regression; AGY-45 held except one leftover reload in ManagePackages; AGY-48 held except the TravelerSidebar boundary import.

## 3. Findings

### High

**REG-1 — StaysStep deletes still-referenced storage images before save** [Confirmed, wave-3 regression of AGY-42]
- `StaysStep.tsx:64-73` fires `removeStorageImage` immediately on remove/replace with no session-upload distinction — unlike `MediaStep.tsx:108-120`, which deletes only this-session uploads precisely so cancelling doesn't break the stored package.
- Impact: edit a published package, replace a stay photo, cancel without saving → live package renders a broken image. Worse in the duplicate flow: the copy carries the original's URLs, so removing one deletes the **original** package's object.
- Fix: mirror MediaStep's `sessionUploadsRef` pattern; defer deletion of previously-persisted objects to a successful save.

**REG-2 — Recreated booking guard doesn't pin `departure_id`: cross-tenant seat exhaustion** [Confirmed, wave-2 blind spot]
- `20260718110000` pins nine fields but not `departure_id`; the capacity trigger counts by `departure_id` with no package-match check, and the FK accepts any departure UUID.
- Impact: an agency can point its own booking at a competitor's departure via raw REST; the competitor's capacity trigger then counts an invisible foreign booking against their seats (their own RLS-scoped count can't see it) and their departure becomes undeletable.
- Fix: add `departure_id` to the pinned list (agencies re-seat via supported flows only), or require the new departure's `package_id = old.package_id`.

**REG-3 — Agency account-status enforcement is still client-only (AGY-4 half-closed)** [Confirmed gap]
- `AgencyStatusGuard` ships visibility (interstitials) and its comment claims "enforcement stays server-side," but no RLS policy or trigger actually checks `travel_agencies.status` on writes — a suspended agency with a raw client or an already-open session keeps operating.
- Fix: `is_active_agency()` helper checked in the write guards for packages/deals/messages/package_bookings (one small migration), plus a status re-check on window focus.

### Medium

**REG-4 — AGY-20 FK-aware delete toast is dead code** [Confirmed, 2 auditors] — `usePackages.ts:104` rethrows `new Error(error.message)`, stripping `.code`; the `23503` branch in ManagePackages can never match. Fix: rethrow the original PostgrestError.

**REG-5 — AGY-28 partial: `useAgencyOverview` still fetches unbounded all-time bookings + reviews** [Confirmed] — every other hook got a bound; the heaviest page didn't. Fix: windowed KPI queries + capped reviews, or an aggregate RPC.

**REG-6 — Calendar Retry is a no-op** [Confirmed regression] — `fetchMonthBookings` now only sets `monthKey`; setting it to the same value re-renders nothing and RQ never refetches. Fix: expose `query.refetch` and wire the error-state Retry to it.

**REG-7 — Title-only edits of a rejected deal don't resubmit, but the UI says they do** [Confirmed, 2 auditors] — `title` isn't in the guard's material-change list, yet the toast/hint promise re-review. Fix: add `title` to the material clause (also clears the stale reason).

**REG-8 — Agency payments policy exposes `payments.raw` (Moyasar payload) via raw REST** [Confirmed shape] — the wave-3 SELECT policy is column-unrestricted; the app selects safe columns, but `select=raw` returns the stored webhook body. Fix: agency-facing view/RPC without `raw`/`provider_*`, or column-level revoke.

**REG-9 / REG-10 — AGY-15 and AGY-16 were never fixed** [Confirmed] — stale hotel `day_numbers` still survive itinerary renumbering, and saving a published package still validates only Basics (price-0 → pending queue). Both were audit Mediums that fell out of the plan; fixes are as originally specified (clamp in `buildSavePackagePayload`; gate `handleSave` on `missingForSubmit` when published).

**REG-11 — `usePackages` is the unsanctioned manual-hook holdout** [Confirmed] — package CRUD invalidates no RQ caches (Dashboard showcase and Deals dropdown go stale up to 60s) and its error retry is still `window.location.reload()`. Fix: migrate to `['agency','packages',userId]` with invalidations.

**REG-12 — Server allows `confirmed→cancelled` but no UI offers it** [Confirmed] — a forced cancellation of a confirmed trip (e.g. after cancelling a departure) has no portal path. Fix: reuse the decline dialog for confirmed bookings.

**REG-13 — Test foundation stops short of the audit's own two named priorities** [Confirmed] — RoleBasedRedirect and `updateBookingStatus` remain untested (54 tests currently, all green).

### Low (condensed)

- **REG-14** `threadLoading` exists but is never consumed — thread switches flash "Send a message to start the conversation" while loading (`Messages.tsx:24`).
- **REG-15** Suspended→pending resubmit skips the departures gate on client *and* server (consistent, but the AGY-6 hole class re-opened for one path); any toggle failure toasts "errorLoadingPackages".
- **REG-16** `canComplete` uses the UTC date (`AgencyBookings.tsx:104`) — inconsistent with the wave-2 local-date standard; Gulf agencies see Mark-completed hours early/late.
- **REG-17** Notification triggers lack the standard service-role skip (seed flips will spawn notifications) and cover only 5 decision types (no booking_created, no account-status).
- **REG-18** Raw-API admin approval leaves a stale `rejection_reason` that the `deal_approved` notification embeds (app path is clean).
- **REG-19** Departure delete guard has no admin bypass (unique among the wave guards) and doesn't protect `completed`-booking linkage.
- **REG-20** `client_errors` accepts unbounded, `user_id NULL` inserts from any authenticated user; `agency_activity_logs` INSERT isn't role-restricted (both are append-only, which is good).
- **REG-21** `platform_settings.demo_mode` missing from generated types; `usePackageDetails.ts:202` double-cast and audit.ts `as never` remain (AGY-43 partial).
- **REG-22** Hygiene leftovers: TravelerSidebar imports the agency `useUnreadMessages`; deal-edit failures toast "Failed to create deal"; literal `support@totravel.demo` in AgencyStatusGuard; INSERT-as-pending is unreachable (add a comment); pending-bookings realtime channel is unfiltered (RLS-safe, WAL-costly at scale).

## 4. Advisors after the waves

Security: no new warnings from any wave table — remaining items are the verified-intentional SECURITY DEFINER set and the leaked-password dashboard toggle (documented in deploy-notes). Performance: reviews unindexed-FKs cleared; new indexes show "unused" only because they're fresh; one new WARN — `payments` now carries three permissive SELECT policies (traveler/admin/agency), a minor evaluation cost that the REG-8 view approach would also resolve.

## 5. Recommended Wave 4 (small, ~1 session)

1. **Guard patch migration**: pin `departure_id` (REG-2), add `title` to the deal material clause + clear reason on approve (REG-7/18), service-role skip in notification triggers (REG-17), admin bypass on departure delete guard (REG-19), `is_active_agency()` checks (REG-3), length caps + role checks on client_errors/agency_activity_logs (REG-20). One migration, probed.
2. **Payments view** without `raw`/provider columns; point `useAgencyPayments` at it (REG-8, also fixes the advisor WARN).
3. **Frontend batch**: StaysStep session-upload cleanup pattern (REG-1), rethrow PostgrestError (REG-4), calendar `refetch` (REG-6), overview bounds (REG-5), `usePackages` RQ migration (REG-11), confirmed-cancel UI (REG-12), threadLoading spinner + canComplete local date + toggle toast copy (REG-14/15/16).
4. **Close the strays**: AGY-15 clamp, AGY-16 gate (REG-9/10), RoleBasedRedirect + updateBookingStatus tests (REG-13), types regen (REG-21), hygiene nits (REG-22).

---

## 6. Wave 4 closure (same day)

Wave 4 landed as commits `ed1b549..e109787` and resolves **REG-1 through REG-22** except three accepted notes: REG-17's booking/account-status notification *coverage* (the service-role skip DID land; new notification types are future work), AGY-34 (seed GUC scope — accepted risk, documented), and the `support@totravel.demo` literal (product decision). Verification: guard probes P1–P6 on the remote (foreign-departure repoint blocked, title-edit resubmit + reason clearing, suspended agency blocked from bookings/messages server-side, no service-role notification spam), payments via the view only (33 rows view / 0 base-table), 65 tests green including the audit's two named priorities, and live browser checks (Cancel on confirmed bookings, payments card through the view, deep-link restore). Deferred by design remain: AGY-37, AGY-39.

*Generated 2026-07-18 by the four-auditor regression sweep; Critical/High claims re-verified against migration SQL. Original audit: 51 findings; post-wave state: 41 held, 2 broken fixes, 2 regressions, 2 unclaimed, 2 deferred-by-design — all resolved or dispositioned by Wave 4.*
