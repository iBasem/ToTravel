# Agency Portal Audit — 2026-07-18

Scope: everything the agency role sees, uses, or triggers — frontend (`src/features/agency`, shared `packages`/`bookings` surfaces, auth/layout shell) and backend (all Supabase migrations, RLS, triggers, edge functions, storage, live advisors). Method: four parallel code auditors (agency frontend, packages pipeline, backend security, cross-cutting) + live Supabase security/performance advisors; every Critical/High claim re-verified against source. Findings are labeled **Confirmed** (failing path traced) or **Suspected** (plausible, needs a runtime check). In-flight stays/hotels work (uncommitted `StaysStep`/`package_hotels`) is audited as-is and flagged where relevant.

---

## 1. Executive summary

- **Cross-tenant isolation holds everywhere.** No table or bucket lets agency A read or write agency B's data. Edge functions compute prices server-side, verify ownership, and the payment webhook fails closed. The foundation is sound.
- **The two Critical issues are the same bug twice:** the package guard and the deal-approval guard are `BEFORE UPDATE` triggers only, while RLS allows direct INSERT — so an agency using the raw API can **self-publish a featured package** (AGY-1) and **self-approve a public deal** (AGY-2), bypassing admin moderation entirely.
- **The agency's own account status is invisible and unenforced in the portal** — suspended/rejected agencies keep full UI access (AGY-4), and an agency can force an unpaid booking to `completed`, unlocking reviews for trips that never happened (AGY-5).
- **Hardcoded demo credentials, including a known-password admin, ship in ordinary migrations** (AGY-3) — must be gated before any non-demo deploy.
- **The messaging surface is the weakest UX area:** failed sends silently lose the message, thread-switching can render the wrong conversation's history, and the full message history is fetched unbounded — including on the Dashboard (AGY-7/8/9).
- **Workflow state machines are asymmetric:** agencies can't decline bookings, withdraw a pending package, resubmit a rejected deal, or edit/cancel a departure once one seat is booked. Several statuses are display-only dead vocabulary.
- **Architecturally, the agency portal opted out of every cross-cutting system the rest of the app uses:** no React Query (8 hand-rolled hooks, no cache/retry/invalidation/abort), no notifications beyond messages, no audit trail of agency actions, no route-level error boundary, zero tests on agency features.
- **Single highest-leverage fix:** extend the two guard triggers to `BEFORE INSERT OR UPDATE` (one small migration closes both Criticals), then ship an agency-status guard in the portal shell.

Overall health: **solid security core, thin operational shell**. Nothing found suggests data loss or tenant leakage; the risks are moderation bypass, workflow dead-ends, and scale/reliability debt.

---

## 2. Agency surface inventory

| Page / Area | Reads | Mutations | Backend objects |
|---|---|---|---|
| Dashboard `/travel_agency` | `package_bookings` (all-time + travelers + packages), published `packages` + media, `reviews`, full `messages` history via MessagesCard | none | packages, package_bookings, reviews, messages, travelers, travel_agencies; realtime `messages-realtime` |
| Packages `/packages` (list) | `packages` + itineraries + media (all statuses) | UPDATE `packages.status` (toggle), DELETE `packages`, navigate to wizard/editor | packages + child tables |
| Create/Edit (wizard/editor) | `packages` + routes, itineraries, media, addons, hotels via `loadPackageFormData` | RPC `save_package` (atomic parent + 5 child delete/reinserts), storage upload `package-media` | save_package RPC v7, package_routes/itineraries/package_media/package_addons/package_hotels |
| Departures `/packages/:id/departures` | `package_departures`, `package_bookings` (for counts) | INSERT/DELETE `package_departures` (update exported, unused) | package_departures |
| Package details (preview) | `usePackageDetails` (published-only), departures via `useAvailability` | none | packages embed, package_departures |
| Bookings `/bookings` | `package_bookings` `select('*')` + packages(+unused media) + travelers, unbounded | UPDATE `package_bookings.status` (UI: pending→confirmed only) | package_bookings |
| Calendar `/calendar` | month-windowed `package_bookings` + package + traveler | none | package_bookings |
| Travelers `/travelers` | all-time `package_bookings` + travelers + package titles, aggregated client-side | none | package_bookings, travelers |
| Gallery `/gallery` | storage `agency-gallery` list (limit 100) + public URLs | storage upload / remove (`agency-gallery/{uid}/…`) | agency-gallery bucket |
| Messages `/messages` | full `messages` history, traveler/agency name lookups | INSERT `messages`, UPDATE `messages.read_at` | messages; realtime `messages-realtime` |
| Deals `/deals` | `deals` by agency; all packages + itineraries + media (for a title dropdown) | INSERT `deals` (approval defaults pending), DELETE `deals` | deals |
| Feedback `/feedback` | `reviews` + travelers + packages, unbounded | none | reviews |
| Shell (layout/header/sidebar) | unread `messages` count | signOut | messages; realtime `unread-messages-{uid}` |
| Edge functions reachable in agency flows | — | none directly (create-booking/payment/review are traveler-side; admin-refund admin-only) | — |

---

## 3. Findings

### Critical

**AGY-1 — Agency can self-publish and self-feature a package via direct INSERT** [Confirmed]
- Evidence: `supabase/migrations/20251226011052:338` INSERT policy checks only `auth.uid() = agency_id`; guard `trg_enforce_package_update_guard` is `BEFORE UPDATE` only (`20260705120000_wiz8_package_update_guard.sql:41-42`); `packages_status_check` permits `'published'`; no INSERT trigger pins `status`/`featured`.
- Impact: `supabase.from('packages').insert({agency_id: self, status:'published', featured:true, …})` bypasses admin review and the `save_package` RPC; the row is immediately public and featured.
- Fix: recreate the guard as `BEFORE INSERT OR UPDATE`; for non-admin/non-service INSERT force `featured=false` and `status ∈ {draft,pending}`.

**AGY-2 — Agency can self-approve a promotional deal via direct INSERT** [Confirmed]
- Evidence: `20260707000300_create_deals.sql:33-35` INSERT policy `with check (auth.uid() = agency_id)`; `guard_deal_approval` is `before update on public.deals` only (`20260709000000:49-50`).
- Impact: inserting `approval_status='approved', status='active'` lands an unmoderated deal in the public approved-active feed.
- Fix: fire `guard_deal_approval` `BEFORE INSERT OR UPDATE`; force `approval_status='pending'` on INSERT for non-admin callers.

### High

**AGY-3 — Hardcoded demo credentials (incl. admin) in ordinary migrations** [Confirmed]
- Evidence: `20260709120200_seed_demo_admin.sql:27` (`admin@totravel.demo` / `DemoAdmin1!` + admin role), `20260705100700:40`, `20260707020200_demo_agency_passwords.sql:5`.
- Impact: any environment these migrations run against has known-password admin/agency logins; credentials live in git history.
- Fix: move demo accounts to gated seed (env flag / `supabase/seed.sql`); never seed an admin with a static password; rotate before any public exposure.

**AGY-4 — Agency account status is never surfaced or enforced in the portal** [Confirmed]
- Evidence: `ProtectedRoute.tsx:41-46` checks only `profile?.role`; grep for `suspended` matches nothing in `src/features/agency/**` or `src/layouts/**`; statuses `pending|active|rejected|suspended` exist (`useAdminAgencies.ts:5`).
- Impact: suspended/rejected agencies retain full portal access (writes fail only where RLS happens to block, with generic errors); pending agencies get no "awaiting approval" state.
- Fix: `AgencyStatusGuard` inside `AgencyRoutes` reading `travel_agencies.status` → interstitial for pending/suspended/rejected; show status in the shell.

**AGY-5 — Agency can force any booking status, incl. `completed` on an unpaid booking** [Confirmed]
- Evidence: `20260705100100_sec2_booking_update_lockdown.sql:33-51` — the guard pins price/payment/traveler fields but lets the owning agency set `status` to any value.
- Impact: `pending` (unpaid) → `completed` satisfies create-review's completed gate → reviews for trips never paid or taken; status desyncs from money.
- Fix: constrain transitions in the guard (e.g. `pending→confirmed|cancelled`, `confirmed→completed` only when `payment_status='paid'`).

**AGY-6 — ManagePackages "Publish" toggle bypasses the submit gate** [Confirmed]
- Evidence: `ManagePackages.tsx:72-73` sets `status='pending'` via direct UPDATE; the ≥1-upcoming-departure gate lives only inside `save_package` (`20260717120000:155-162`); the update guard allows any `draft→pending`.
- Impact: packages with zero departures (or legacy rows with empty price/description) reach the admin review queue; list page and editor enforce different rules for the same transition.
- Fix: route the toggle through `save_package(p_submit_for_review=>true)` or replicate the gate in the update guard.

**AGY-7 — Failed message send is silently swallowed; the message is lost** [Confirmed]
- Evidence: `MessageThread.tsx:36-40` calls `onSend(...)` without await/catch and clears the input; `useAgencyMessages.ts:157-159` rethrows.
- Impact: on any network/RLS failure the reply vanishes with zero feedback.
- Fix: await the send; on failure restore input + toast (or optimistic append with failed-state retry).

**AGY-8 — Thread switching can render the wrong conversation's messages** [Confirmed]
- Evidence: `useAgencyMessages.ts:107-135` — `setSelectedConversation` fires before the fetch, `messages` is never cleared, errors only `console.error`; no abort/sequence token, so concurrent switches let a stale response win.
- Impact: agency reads (and replies into) a thread showing a different traveler's history — mis-reply risk.
- Fix: clear messages / per-thread loading state before fetch; guard with a request token or AbortController; surface fetch errors.

**AGY-9 — Entire message history fetched unbounded — including on the Dashboard** [Confirmed]
- Evidence: `useAgencyMessages.ts:43-47` `select('*')`, no limit; `MessagesCard.tsx:13` mounts the full hook (all messages + lookups + a realtime channel) to render 4 rows.
- Impact: payload/memory grow with lifetime volume; the Dashboard pays the full cost on every visit.
- Fix: last-message-per-peer + unread-count RPC (or `.limit()`); give MessagesCard a lightweight query.

**AGY-10 — Reviews queries filter an aliased embed by table name — Dashboard/Feedback may 400** [Suspected]
- Evidence: `useAgencyOverview.ts:252-254`, `useAgencyFeedback.ts:52-54` embed `package:packages!inner(...)` but filter `.eq('packages.agency_id', …)`; `useAgencyCalendar.ts:58` correctly uses the alias. PostgREST requires filters to reference the alias once declared.
- Impact: if enforced by the deployed PostgREST version, the reviews fetch fails for every agency (Dashboard error state, Feedback error page); at best it's fragile inconsistency.
- Fix: change both to `.eq('package.agency_id', …)`; verify once against the live API.

**AGY-11 — Agency preview of a draft/pending package dead-ends at "Package not found"** [Confirmed]
- Evidence: `ManagePackages.tsx:140` → `/travel_agency/packages/:id` → `usePackageDetails.ts:189` hard-filters `.eq('status','published')`.
- Impact: preview is useless precisely when it matters (before publishing); also hides the new stays section during authoring.
- Fix: skip the status filter when the viewer owns the package (RLS already scopes access).

**AGY-12 — Profile-fetch failure leaves the agency on an infinite spinner** [Confirmed]
- Evidence: `AuthContext.tsx:57-60` returns null on error; `ProtectedRoute.tsx:33-39` renders a spinner forever when role required and no profile; refresh path retries via bare `setTimeout(…,100)`.
- Impact: one transient PostgREST failure at load bricks the portal until manual reload.
- Fix: track `profileError` in AuthContext; render a retry screen instead of the spinner.

### Medium

**AGY-13 — `moyasar-webhook` `verify_jwt=false` not declared in `config.toml`** [Confirmed] — comment in `moyasar-webhook/index.ts:7` requires it; config has only `project_id`. A clean deploy rejects Moyasar's callback at the gateway → payments never reconcile. Fix: per-function `[functions.moyasar-webhook] verify_jwt = false` (and keep the other five verified).

**AGY-14 — Legacy `package-media` bucket allows any authenticated user to upload to any path** [Confirmed] — `20251226011052:504-506` INSERT policy has no folder scoping (unlike agency-gallery/avatars); live advisor also flags all three public buckets as listable. Fix: scope INSERT to owner folder; drop broad SELECT listing policies.

**AGY-15 — Stay `day_numbers` go stale when itinerary days are removed/renumbered** [Confirmed, in-progress area] — `ItineraryStep.tsx:45-49` renumbers days, hotels never remapped; `WhereYoullStay.tsx:88-97` renders stale "Days 4, 5" on a 4-day trip. Fix: remap/prune `day_numbers` on itinerary change or clamp in `buildSavePackagePayload`.

**AGY-16 — Saving a published package skips all validation beyond Basics** [Confirmed] — `PackageEditor.tsx:260` gates on step-1 fields only; `savePackagePayload.ts:33` coerces empty price to `0`. A live package can be saved into `pending` with price 0/no destination. Fix: gate `handleSave` on `missingForSubmit()` when published or submitting.

**AGY-17 — Departure with bookings has no exit path; `updateDeparture` is dead code** [Confirmed] — `DeparturesEditor.tsx:79-82` only add/delete; `useDepartures.ts:88-92` update has zero call sites; a `cancelled` badge exists that nothing can set. Fix: edit (seats ≥ booked, price) + cancel actions.

**AGY-18 — Booked-seat counts keyed by `booking_date` string, not `departure_id`** [Suspected] — `useDepartures.ts:55-63` vs DB capacity trigger counting by `departure_id` (`20260705140000`). Same-date legacy bookings inflate counts; drift undercounts. Fix: aggregate by `departure_id`, date fallback for null links.

**AGY-19 — Departure delete guard is client-side only; FK `on delete set null` silently detaches bookings** [Suspected] — `20260705140000:10-11`; if the client count is wrong (AGY-18), delete degrades bookings to free-date capacity. Fix: BEFORE DELETE trigger rejecting deletion with active linked bookings.

**AGY-20 — No retire path for packages with booking history** [Confirmed] — delete always hits ON DELETE RESTRICT (`20260705100500:15-18`) → generic toast (`ManagePackages.tsx:84-92`); sanctioned alternative (`archived`) is admin-only. Fix: specific FK-violation message now; agency-initiated archive later.

**AGY-21 — Message read-state and realtime binding gaps** [Confirmed] — mark-read never refreshes list badges (`useAgencyMessages.ts:125-130`); channel torn down/recreated per thread switch, INSERT-only binding so read-receipts and own-messages-from-other-devices never live-update (`:170-199`). Fix: patch conversation state after mark-read; one channel per user with UPDATE binding + refetch on subscribe.

**AGY-22 — "Revenue" means different things on different pages** [Confirmed] — `AgencyBookings.tsx:83-85` sums confirmed-only; `useAgencyOverview.ts:100,119` sums all non-cancelled. Fix: one shared definition/helper.

**AGY-23 — Deal `status` frozen at creation; expired stays "Active", scheduled never activates** [Confirmed] — `Deals.tsx:45-52`; no job/view flips status. Fix: derive display status from dates (client), or server view/job.

**AGY-24 — Deal form validates nothing beyond presence** [Confirmed] — `Deals.tsx:36-45,176-179`: no `end≥start` check; discount unclamped past the HTML hints (0/negative/500% submits). Fix: validate in `handleAddDeal`.

**AGY-25 — Deal deletion is one-click permanent** [Confirmed] — `Deals.tsx:231-239`, hard `.delete()`, no AlertDialog (Gallery has one). Fix: reuse the Gallery confirm pattern.

**AGY-26 — Calendar month-switch race** [Confirmed] — `useAgencyCalendar.ts:30-89` no abort/token; stale month's rows can win. Fix: request token / AbortController.

**AGY-27 — Gallery: load failure renders as "No Media Yet"; silent 100-item cap** [Confirmed] — `Gallery.tsx:59-64` (no error state), `:47` (`limit:100`, count lies, older photos unreachable). Fix: error EmptyState + retry; paginate.

**AGY-28 — All agency list hooks fetch unbounded all-time data** [Confirmed] — overview (all bookings + all reviews), travelers (every booking row), bookings (`select('*')` + unused `package_media` embed), feedback. Fix: limits/pagination or aggregate RPCs; drop the unused embed.

**AGY-29 — Package status UX dead-ends** [Confirmed] — pending toggle self-assigns `pending` while toasting "Submitted" (`ManagePackages.tsx:72`, `PackageDetailPane.tsx:95-99`); no withdraw-to-draft (DB allows it); archived/suspended excluded from filters (`ManagePackages.tsx:19`). Fix: per-status actions (Submit / Withdraw / Resubmit) + filter chips.

**AGY-30 — No route-level error boundary** [Confirmed] — only `App.tsx:60/112`; a render error in any agency page whites out the whole shell. Fix: boundary around `DashboardLayout`'s `<Outlet/>` keyed on pathname.

**AGY-31 — Zero audit trail / telemetry of agency actions** [Confirmed] — `useAdminAudit` exists for admins; nothing logs agency publishes, booking confirmations, deal changes; no client error reporter. Fix: reuse the audit pattern for high-value agency mutations; wire error reporting in the root boundary.

**AGY-32 — Upcoming-trip end date off by one in UTC- timezones** [Confirmed] — `UpcomingTripsCard.tsx:38` mixes UTC parse with local `parseISO` formatting. Fix: `addDays(parseISO(...))`.

### Low (condensed — all Confirmed unless noted)

- **AGY-33** `travel_agencies` own-update policy lacks `WITH CHECK` (trigger backstops sensitive cols) — add for symmetry. `20260103171629:31-36`.
- **AGY-34** Seed migrations set the service-role bypass GUC with session scope (`set_config(..., false)`) — use transaction-local. `20260709000200:5` et al.
- **AGY-35** Perf: `reviews.package_id`/`traveler_id` unindexed; live advisors: 79 multiple-permissive-policy warnings (worst `package_addons`/`package_hotels` at 20 each), 23 `auth_rls_initplan` re-evaluations. Consolidate policies on the new tables; add the two indexes.
- **AGY-36** Hardening: 4 SECURITY DEFINER RPCs callable by `anon`/`authenticated` (`agency_public_stats`, `has_role`, `review_authors`, `compute_platform_stats` — `save_package` correctly restricted); public buckets listable; leaked-password protection disabled. Revoke/lock down per advisor links.
- **AGY-37** Structured inclusion categories flatten on save, reset on load — categorized UX exists only on first authoring. `savePackagePayload.ts:8-14`, `loadPackageFormData.ts:96-105`.
- **AGY-38** Uncaptioned media acquire their filename as a permanent caption after one edit round-trip. `loadPackageFormData.ts:116` / `savePackagePayload.ts:91`.
- **AGY-39** `route.travelMode`/`showDistances` never persisted — silently revert each edit. `loadPackageFormData.ts:59-60`.
- **AGY-40** Unnamed stays silently discarded on save (uploaded image orphaned); no required-name indication. `savePackagePayload.ts:64-65`. [in-progress area]
- **AGY-41** Star rating rendered twice per stay card. `WhereYoullStay.tsx:74,84-86`. [in-progress area]
- **AGY-42** Storage objects orphaned on image removal / package delete (no `.remove()` anywhere in the feature). `StaysStep.tsx:142`, `usePackages.ts:90-112`.
- **AGY-43** Type-safety holes: `data as unknown as PackageDetails` (`usePackageDetails.ts:196`), hand-written row shapes in `useBookings`/`useAgencyDeals`, `payload.new as Message`, non-nullable `available_from/to` that nothing writes. Derive from generated `Database` types.
- **AGY-44** i18n nits: `agencyDashboard.notifications` key missing in both locales; `noPackagesFound` shown for traveler search; hardcoded `'User'`/`'Admin'` fallbacks; `Travelers.tsx:104` re-implements initials unsafely (double space → "undefined") instead of `initials()`.
- **AGY-45** Bookings error retry does `window.location.reload()` though `refetch` exists. `AgencyBookings.tsx:35`.
- **AGY-46** 8 `console.log` calls (user IDs/roles) in `RoleBasedRedirect.tsx:13-48`; `DashboardLayout.tsx:20-27` duplicates ProtectedRoute's guard and drops the deep-link `state.from`.
- **AGY-47** Deals page fetches all packages + itineraries + media (incl. drafts) for a title dropdown; drafts can be deal targets. `Deals.tsx:20`, `usePackages.ts:29-44`.
- **AGY-48** Dead code: `useDashboardStats.ts` unreferenced (with a divergent revenue formula); traveler sidebar imports `useUnreadMessages` from the agency feature (boundary smell).
- **AGY-49** KPI cards show all-time totals captioned with a 30-day delta — misleading. `useAgencyOverview.ts:201-203`, `OverviewKpis.tsx:38-63`.
- **AGY-50** Deal active-vs-scheduled decision compares local date to UTC date — wrong initial status near midnight. `Deals.tsx:45`.
- **AGY-51** `client.ts` doesn't validate env vars — missing `.env` yields `createClient(undefined, undefined)` and cryptic failures.

### Verified-OK (no finding)

Cross-tenant RLS on all package child tables, bookings, deals, messages, payouts; `save_package` v7 (ownership, forced status/featured, locked EXECUTE, atomic transaction — mid-save failure rolls back cleanly); all six edge functions (server-side pricing, ownership checks, admin check + audit on refunds, constant-time webhook secret compare, idempotent payment state machine); trigger hardening (`SECURITY DEFINER SET search_path`, EXECUTE revoked); agency-gallery/avatars write scoping + MIME/size caps; i18n parity (0 missing ar keys; agency/stays keys complete incl. Arabic plurals); RTL conventions; session/deep-link handling; `types.ts` in sync with the WIP hotels migrations.

---

## 4. Missing architecture

| Gap | Today | Missing | Recommended pattern |
|---|---|---|---|
| **Data-fetching split-brain** | 8 hand-rolled `useState`/`useEffect` hooks; zero React Query in agency code while admin (17 hooks), traveler, and even agency-facing `OperatorInfo` use it; `QueryClient` has no default options | Caching, invalidation (confirming a booking never refreshes Dashboard numbers), retry, dedup, abort | Migrate agency hooks + `useBookings` to React Query with `['agency', userId, …]` keys mirroring the admin convention (fixes AGY-8/21/26/28's race class wholesale) |
| **Notifications** | Realtime on `messages` only | Agency never learns of new bookings, deal approval/rejection, package suspension except by revisiting pages | Realtime on `package_bookings` (agency filter) → header badge; a `notifications` table written by admin approval flows |
| **Booking lifecycle** | UI: pending→confirmed only; `completed` set nowhere in code; no decline | Decline (→cancelled + reason), mark-completed post-travel (or scheduled job) — pairs with the AGY-5 server-side transition constraint | Explicit transition map enforced in the guard, mirrored in UI actions |
| **Agency-side finance** | `payments` has no agency-visible policy (safe-by-omission); `agency_payouts` readable but no UI found consuming it | Payment/payout ledger for the agency's own bookings | SELECT policy joining payments→bookings→packages on `agency_id`, plus an earnings page |
| **Observability** | One root ErrorBoundary, `console.error`, admin-only audit | Route-level boundaries, client error reporting, agency action audit | AGY-30/31 |
| **Tests** | 6 files / 37 tests, all pure libs (wizard validation + save payload are covered — the best area) | Zero coverage: agency hooks, booking status flow, auth guards, deals, messaging | Priority: ProtectedRoute/RoleBasedRedirect, `updateBookingStatus`, then hooks post-React-Query migration |

---

## 5. Risk assessment

| Risk | Likelihood | Impact | Trigger scenario | Mitigation |
|---|---|---|---|---|
| Moderation bypass via direct INSERT (AGY-1/2) | M (needs API knowledge, trivial once known) | H | Malicious/curious agency scripts a REST call; unvetted content goes public/featured | Wave-1 trigger migration |
| Fake reviews via forced `completed` (AGY-5) | M | H | Agency inflates rating with unpaid bookings + create-review | Wave-1 transition constraint |
| Demo admin credentials in a real deploy (AGY-3) | L today, H at launch | H | Migrations run against prod; anyone logs in as admin | Gate/rotate before launch |
| Payments stop reconciling after clean redeploy (AGY-13) | M | H | CI/CLI deploy resets `verify_jwt` default; webhooks 401 silently | config.toml entry + a webhook health check |
| Suspended agency keeps operating (AGY-4) | M | M-H | Admin suspends; agency continues messaging/confirming | Status guard interstitial |
| Lost agency replies erode trust (AGY-7/8) | H (any flaky network) | M | Send fails silently; wrong thread rendered | Messaging fixes wave 1-2 |
| Scale degradation for successful agencies (AGY-9/28) | H over time | M | Message/booking volume grows linearly into page weight | Limits/RPCs, React Query |
| Data confusion (revenue, dates, deal status — AGY-22/23/32) | H | L-M | Agencies make decisions on inconsistent numbers | Wave-2 correctness batch |
| Departure/booking capacity drift (AGY-17/18/19) | L-M | M | Legacy same-date bookings; client-only delete guard | Wave-2 departures batch |

---

## 6. Improvement plan

### Wave 1 — Security & correctness (ship first; independently deployable)
1. **Guard triggers → `BEFORE INSERT OR UPDATE`** for packages and deals; pin `status`/`featured`/`approval_status` on INSERT (AGY-1, AGY-2). **[S, one migration]**
2. **Booking status transition map** in the booking lockdown guard: agency limited to `pending→confirmed|cancelled`, `confirmed→completed` only if paid (AGY-5). **[S]**
3. **Gate demo credentials** out of ordinary migrations; rotate (AGY-3). **[S]**
4. **`config.toml` per-function `verify_jwt`** (AGY-13). **[S]**
5. **Agency status guard + interstitial** in the portal shell (AGY-4). **[M]**
6. **Messaging integrity**: await sends with failure recovery; clear/abort on thread switch (AGY-7, AGY-8). **[M]**
7. **Verify & fix the aliased-embed filters** (AGY-10) — one runtime check, two-line fix. **[S]**
8. **Route ManagePackages toggle through `save_package`** so the submit gate holds (AGY-6). **[S]**
9. **Owner preview of unpublished packages** (AGY-11). **[S]**
10. **Scope `package-media` INSERT policy; drop bucket-listing SELECTs** (AGY-14, part of AGY-36). **[S]**

### Wave 2 — Reliability & workflow completeness
1. **React Query migration** of the 8 agency hooks + `useBookings` (retires AGY-21/26/28 races and duplication; add QueryClient defaults). **[L]**
2. **Booking actions**: decline with reason; completed via action or scheduled job (Missing-architecture pairing of AGY-5). **[M]**
3. **Package status UX**: withdraw-to-draft, resubmit-suspended, archived/suspended filters, correct labels; specific FK-violation message on delete (AGY-19→AGY-20, AGY-29). **[M]**
4. **Departures**: edit/cancel actions, count by `departure_id`, BEFORE DELETE trigger (AGY-17/18/19). **[M]**
5. **Deals**: form validation, delete confirm, derived status, rejection-reason column + edit/resubmit path (AGY-23/24/25 + dead-end). **[M]**
6. **Bounded queries**: message-list RPC + limits across overview/travelers/feedback/gallery pagination (AGY-9, AGY-27, AGY-28). **[M]**
7. **Error surfaces**: profile-fetch retry screen (AGY-12), route-level ErrorBoundary (AGY-30), gallery error state (AGY-27), `refetch` not reload (AGY-45). **[M]**
8. **Bookings realtime badge** — first notification beyond messages. **[M]**
9. **Correctness batch**: shared revenue definition, TZ fixes, KPI captions (AGY-22/32/49/50). **[S]**

### Wave 3 — Architecture & polish
1. **Notifications table + admin-flow writers** (deal/package decisions) with header center. **[L]**
2. **Agency action audit** reusing the admin audit pattern + client error reporting. **[M]**
3. **Agency finance visibility**: payments SELECT policy + earnings/payout view (AGY-35 index work rides along). **[M]**
4. **Test foundation**: auth guards, booking transitions, then hook tests on the React Query layer. **[M]**
5. **Save-pipeline fidelity**: inclusion categories round-trip, caption fallback, travelMode persistence, unnamed-stay warning, storage cleanup (AGY-37…42). **[M]**
6. **Type safety**: derive all row shapes from generated types; validate env at boot (AGY-43, AGY-51). **[S]**
7. **Hygiene sweep**: dead code, console.logs, duplicate guard, i18n nits, RPC/bucket hardening per advisors, policy consolidation on `package_addons`/`package_hotels` (AGY-33/34/36/44/46/47/48). **[S]**

---

*Generated 2026-07-18 by a four-agent code audit (agency frontend / packages pipeline / backend security / cross-cutting) plus live Supabase advisors; Critical and High findings independently re-verified against source.*
