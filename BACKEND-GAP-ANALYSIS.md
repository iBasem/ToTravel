# ToTravel — Backend Production-Readiness Gap Analysis

**Date:** 2026-07-05
**Branch reviewed:** `feat/arabic-first` (HEAD `2688dda`)
**Live Supabase project:** `saouviwryaswacjtfswc` (region ap-south-1, Postgres 17)
**Method:** Evidence-based static analysis of the full repo + live verification against the deployed database and Supabase advisors. Every finding below is backed by a file/line reference or a live DB query result. Items that could not be verified are marked explicitly.

> **This is an analysis-only deliverable. No code or schema was modified.** Implementation should not begin until this report is reviewed and priorities are approved.

---

## 0. System Overview (verified)

ToTravel is a **client-only architecture**: a Vite + React 18 + TypeScript SPA whose entire "backend" is Supabase.

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vite 5, React 18, TanStack Query, react-router 6, i18next (Arabic-first, RTL) | Feature-foldered SPA |
| API | Supabase PostgREST (auto REST over Postgres) + 2 Deno Edge Functions | `create-booking`, `create-review` (both `verify_jwt=true`, confirmed) |
| DB | Postgres 17, 15 public tables, RLS enabled on all 15 (verified) | + `profiles` view (`security_invoker`) |
| Auth | Supabase Auth (email/password), roles in `user_roles` table | 6-char min password, client-side |
| Storage | Supabase Storage, public bucket `package-media` | `agency-gallery` referenced in code but **does not exist** |
| Jobs/Queues | **None** | No cron, no workers, no queues |
| Payments | **None** | Columns exist; no gateway integrated |
| Email/Notifications | **None** | No SMTP/Resend/SendGrid; only in-app toasts |
| Observability | **None** | No error tracking, no alerting, no structured logs |
| CI/CD | **None** | No `.github/`, no typecheck gate, manual deploy |

**Data-layer shape:** 29 of ~30 data hooks are hand-rolled `useState`/`useEffect` + direct `supabase.from()` calls. React Query is mounted but used in exactly one hook. There is **no server-side pagination anywhere** (zero `.range()` calls).

### Overall Readiness Score: **3 / 10 — NOT launch-ready**

| Dimension | Score | One-line justification |
|---|---|---|
| Security | 3/10 | Sound role model, but live-verified privilege-escalation (agency self-verify, booking tampering) |
| Correctness / Business completeness | 3/10 | No payments; review flow unreachable; several features query non-existent tables |
| Reliability / Resilience | 3/10 | No retries/idempotency on bookings; silent admin failures |
| Scalability | 4/10 | Fine at 12 packages; no pagination, client-side joins, RLS initplan issues |
| Observability | 1/10 | No error tracking, alerting, or structured logging |
| Maintainability | 5/10 | Clean feature folders; but `strict:false`, 30 tsc errors ship, heavy duplication |
| Operational readiness (CI/CD/DR) | 2/10 | No CI, no automated gates, manual deploy, drifted config |
| **What's genuinely strong** | — | Server-side price trust, non-escalatable roles, RLS on all tables, hardened triggers, honest self-docs |

The security-hardening pass done in the `20260704` migrations is real and effective for **insert** paths. The blockers below are the ones that remain.

---

## Architecture Decisions (owner-approved, 2026-07-05)

These decisions were made after the initial audit and shape the roadmap below.

**Target market:** Saudi Arabia / Gulf (Arabic-first, SAR/AED). Primary card network is **mada** — this is a hard requirement for payments.

**Backend approach — hybrid Supabase + Cloudflare:**
| Concern | Choice | Notes |
|---|---|---|
| Database access | Supabase JS client | Unchanged |
| Business logic | Supabase Edge Functions | Payments webhook, presigned uploads, etc. |
| Transactional / complex ops | Postgres functions (RPC) | Fixes BUS-2 capacity + ARCH-4 atomic save |
| Authorization | RLS | Remains the real enforcement layer |
| Object storage | **Cloudflare R2** (migrate pre-launch) | Replaces Supabase Storage `package-media` |
| Image delivery | **Cloudflare image resizing in front of R2** | Required for "fast photos"; R2 alone serves originals |
| CDN / DNS / edge security | Cloudflare | Website + public assets; **not** an automatic shield for the Supabase API |
| DB region | **Stay on ap-south-1 (Mumbai)** | ~40ms to Gulf; Cloudflare edge covers site + images. No migration. |

**Payments:** **Moyasar** (primary recommendation — mada, Apple Pay, Visa/MC, STC Pay, native SAR). Tap Payments is the fallback if UAE/wider-Gulf volume grows. **Stripe rejected** (no mada). Golden rule: the provider **webhook, verified inside an Edge Function, is the sole authority** that sets `payment_status='paid'`; the client is never trusted.

**ARCH-1 scope resolution:** **Guides = remove** (delete page + hook). **Deals and Messages = build** (new tables + RLS), no longer treated as bugs.

**Cloudflare connector status (updated 2026-07-05):** connector authenticated. R2 **enabled** by owner. Bucket **`totravel-media` created** (private, location `ENAM` — acceptable since Cloudflare CDN caches reads at Gulf edges; recreate with an APAC/WEUR hint via dashboard only if desired). Still needed from owner: a **domain on Cloudflare** (for public image reads + image resizing) and an **R2 API token** (Access Key + Secret → stored in Supabase Edge Function secrets, never in the client).

---

## Phase 20 — Consolidated Gap Report

Severity: **Critical** (blocks launch / exploitable / data-loss) · **High** · **Medium** · **Low**.
Effort: **S** (<0.5d) · **M** (0.5–2d) · **L** (2–5d) · **XL** (>1wk).
✅ = live-verified against the deployed database in this session.

### CRITICAL

---

**SEC-1 — Agency can self-verify and zero its own commission** ✅
- **Category:** Authorization (Broken Object-Level Auth)
- **Evidence:** RLS policy `travel_agencies "Agencies can update their own profile"` has `qual = auth.uid()=id` and **`with_check = null`** (verified live via `pg_policies`). The `authenticated` role holds column-level UPDATE grants on **every** column including `is_verified`, `commission_rate`, `status`, `rating`, `total_reviews` (verified live via `information_schema.role_column_grants`). Migration: `20260103171629_...sql:31-36`.
- **Exploit:** Logged-in agency runs `supabase.from('travel_agencies').update({ is_verified:true, status:'active', commission_rate:0, rating:5, total_reviews:999 }).eq('id', myId)` → instant trust badge, escapes admin approval queue, sets platform commission to **0** (direct revenue loss), fakes rating.
- **Root cause:** `USING`-only policy + default column grants; no `WITH CHECK` and no column-privilege revocation.
- **Fix:** `REVOKE UPDATE (is_verified, status, commission_rate, rating, total_reviews) ON public.travel_agencies FROM authenticated;` and add a `WITH CHECK` (or `BEFORE UPDATE` trigger) pinning those columns. Route verification/commission changes through admin-only paths.
- **Effort:** S · **Priority:** P0 · **Risk if unresolved:** Revenue loss + trust-system bypass.

---

**SEC-2 — Traveler can rewrite their own booking's price, status, and payment** ✅
- **Category:** Authorization / Payment integrity
- **Evidence:** RLS `package_bookings "Travelers can update their own bookings"` — `qual = auth.uid()=traveler_id`, **`with_check = null`** (verified live). Columns `total_price`, `status`, `payment_status`, `payment_reference` are all writable. Migration `20260103171629_...sql:53-58`. This directly reopens the hole that `20260704000100` (edge-function-only inserts) was created to close.
- **Exploit:** Book normally, then `PATCH /package_bookings?id=eq.X` with `{total_price:1, payment_status:'paid', status:'completed'}`. Yields a "paid/completed" booking at any price, **corrupts all admin revenue stats** (which `SUM(total_price)`), and **unlocks review fraud** — `create-review` only checks `status==='completed'`, so the user can self-complete and review trips that never happened.
- **Root cause:** Same class as SEC-1.
- **Fix:** Drop the broad policy. If travelers need to edit `special_requests` only, grant that column and add a trigger blocking changes to `traveler_id/total_price/status/payment_status`. Cancellations go through a controlled function/edge function.
- **Effort:** M · **Priority:** P0 · **Risk:** Financial fraud, corrupted reporting, review fraud.

---

**BUS-1 — No payment integration exists** ✅ (0 gateway code)
- **Category:** Feature gap (business-critical)
- **Evidence:** No Stripe/PayPal/Tap/HyperPay/Moyasar SDK anywhere (grep). `payment_status`/`payment_method`/`payment_reference` columns exist but unused (`20251226011052:163-165`). The only "PayPal" reference is a dead `<SelectItem>` in the unused `BookingStep4.tsx:163`. "Refund" = a status flag flip with no money movement (`useAdminBookings.ts:132`).
- **Impact:** The platform cannot take money. Bookings are recorded as `pending`/`pending` forever.
- **Root cause:** Never built.
- **Fix (DECISION 2026-07-05):** Integrate **Moyasar** (mada + Apple Pay + Visa/MC + STC Pay, native SAR; **Stripe rejected — no mada**). Tap Payments is the fallback for wider-Gulf/UAE expansion. A provider **webhook, verified inside a Supabase Edge Function, is the sole authority** that sets `payment_status='paid'` (via service role) — the client is never trusted (this also structurally closes SEC-2's payment-tampering vector). Store the Moyasar secret key in Supabase Edge Function secrets, never in the client bundle.
- **Effort:** XL · **Priority:** P0 (for any real launch) · **Risk:** No revenue.

---

**BUS-2 — Booking capacity is not enforced; guaranteed overbooking** ✅ (no aggregate check)
- **Category:** Business logic / concurrency
- **Evidence:** `create-booking/index.ts:87-89` checks only `participants > pkg.max_participants` for a **single** booking — no `SUM(participants)` across existing bookings, no `SELECT … FOR UPDATE`, no unique/exclusion constraint, no `seats_booked` counter. Confirmed absent in all migrations.
- **Exploit:** N concurrent bookings of `max_participants` each all succeed → a 16-seat trip sells 160 seats. Even serially, total booked seats are unbounded.
- **Root cause:** Inventory model never implemented at the DB level.
- **Fix:** Enforce in DB: trigger on `package_bookings` that locks the package row and validates `SUM(participants) FILTER (status IN ('pending','confirmed')) + NEW.participants <= max_participants`; or a `seats_booked` counter column with `CHECK (seats_booked <= max_participants)` updated in the same transaction.
- **Effort:** M · **Priority:** P0 · **Risk:** Overselling real trips, refunds, reputational damage.

---

**DATA-1 — `travel_agencies` → `auth.users` FK permanently dropped to insert mock data** ✅
- **Category:** Data integrity
- **Evidence:** `20251226012433_...sql:2` — `ALTER TABLE travel_agencies DROP CONSTRAINT IF EXISTS travel_agencies_id_fkey;` then inserts 3 mock agencies with fabricated UUIDs. **Never re-added** in any later migration (confirmed: constraint absent).
- **Impact:** Agency rows are no longer tied to auth accounts. Deleting an auth user no longer cascades to its agency (orphaned PII + publicly-visible packages). The `handle_new_user()` invariant (agency row mirrors auth user) is broken.
- **Root cause:** Schema mutated to fit demo data.
- **Fix:** Remove/re-key mock rows, move them to `supabase/seed.sql`, then `ADD CONSTRAINT travel_agencies_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`.
- **Effort:** M · **Priority:** P0 · **Risk:** Orphaned records, broken cascade, integrity drift.

---

**ARCH-1 — Three agency features query tables that do not exist** ✅ (guides/deals/messages absent)
- **Category:** Broken features / type-safety failure
- **Evidence:** `useAgencyDeals.ts:30` → `.from('deals')`, `useAgencyGuides.ts:29` → `.from('guides')`, `useAgencyMessages.ts:39` → `.from('messages')` (+ realtime channel). Live DB has none of these (verified: `ghost_tables_present = 0`). `tsc --noEmit` reports 28 errors here; they ship because `vite build` doesn't type-check.
- **Impact:** Agency Deals, Guides, and Messages pages fail every fetch (PostgREST 404); CRUD there can never work. Errors only `console.error`'d.
- **DECISION (2026-07-05):** **Guides → remove** page + `useAgencyGuides` hook. **Deals → build** `deals` table + RLS. **Messages → build** `messages` table + RLS (+ realtime). Add `tsc --noEmit` to CI so this class can't recur.
- **Effort:** S (remove Guides) + L (build Deals + Messages tables/RLS/UI wiring) · **Priority:** P0 (Guides removal) / P2 (Deals+Messages build) · **Risk:** Dead UI shipped to agencies.

---

### HIGH

---

**SEC-3 — Public (anonymous) read of full agency PII** ✅ (policy `USING(true)`, no role restriction)
- **Category:** Sensitive data exposure
- **Evidence:** `20251226011052:319-321` — `"Anyone can view travel agencies" FOR SELECT USING (true)` (no `TO authenticated`). `anon` reads every column incl. `email`, `phone`, `license_number`, `address`, `commission_rate`, `status`. The `profiles` view (`GRANT SELECT … TO anon`) surfaces the same.
- **Exploit:** Unauthenticated `GET /rest/v1/travel_agencies?select=*` scrapes the full agency directory with contact PII and internal commission rates.
- **Fix:** Expose a public-safe projection (company_name, description, city, country, rating, avatar) via a view/column grants; restrict email/phone/license/commission to owner + admins.
- **Effort:** M · **Priority:** P1 · **Risk:** PII scraping, competitive leakage.

---

**SEC-4 — Missing admin RLS policies → admin verify & review-moderation silently no-op** ✅
- **Category:** Authorization / broken admin workflow
- **Evidence:** Live query: `admin_agency_update_policies = 0`, `admin_review_delete_policies = 0`. `useAdminAgencies.ts:104-124` updates `travel_agencies` and `useAdminReviews.ts` deletes from `reviews` — both match **0 rows** under RLS, return success-shaped results, UI toasts success.
- **Impact:** Admins believe they verified an agency or removed an abusive review; nothing happened. Silent, dangerous, and undermines trust & safety.
- **Fix:** Add `"Admins can update all agencies"` and `"Admins can delete any review"` policies (`USING has_role(auth.uid(),'admin')`). Note SEC-1's fix must not re-block admins.
- **Effort:** S · **Priority:** P1 · **Risk:** Moderation/verification are non-functional.

---

**BUS-3 — Review flow is unreachable end-to-end** ✅ (0 completed bookings, no setter)
- **Category:** Business logic
- **Evidence:** Reviews require `booking.status==='completed'` (`create-review/index.ts:74`, `ReviewsSection.tsx:35`). **Nothing ever sets `completed`** — grep finds zero setters; agency flow only does pending→confirmed, admin only cancels. Live: `completed_bookings = 0`. `TravelerBookings.tsx:168` "Write Review" button has no `onClick`.
- **Impact:** No legitimate user can ever leave a review; the entire review/rating system is inert (0 rows) except via the SEC-2 exploit.
- **Fix:** Add a completion transition — a scheduled job (or admin/agency action) that marks bookings `completed` after `booking_date` passes; wire the review button.
- **Effort:** M · **Priority:** P1 · **Risk:** No social proof; rating system dead.

---

**BUS-4 — Displayed price ≠ charged price (fabricated discounts)** 
- **Category:** Business logic / trust
- **Evidence:** `useAvailability.ts:64-80` simulates seats and **random 15%/30% discounts** client-side; `PackageDetails.tsx:261` passes the fake `discount_price` into the booking modal, but `create-booking/index.ts:91` charges full `base_price * participants`. Customer sees $850, booking records $1,000.
- **Impact:** Users are shown discounts that aren't honored — consumer-protection and trust risk.
- **Fix:** Remove simulated availability/discounts, or model real departures/pricing in the DB and price from it server-side.
- **Effort:** M · **Priority:** P1 · **Risk:** Chargebacks, complaints, legal exposure.

---

**BUS-5 — No payout engine; commission hardcoded** ✅ (agency_payouts 0 rows, no writer)
- **Category:** Business logic
- **Evidence:** No code INSERTs into `agency_payouts` (only reads/status-flips: `useAdminFinancials.ts:69,168`). Commission is a hardcoded `0.12` client-side (`:108`); the per-agency `commission_rate` column is never used in any calculation; AdminSettings "save" bulk-overwrites **all** agencies' rate (`AdminSettings.tsx:100`).
- **Impact:** Agencies can never be paid; financial reporting is fictional.
- **Fix:** Build payout calculation (from confirmed/completed paid bookings × per-agency `commission_rate`) as a scheduled job/edge function writing an auditable ledger with idempotency.
- **Effort:** L · **Priority:** P1 (before onboarding paying agencies) · **Risk:** Cannot operate a marketplace.

---

**DATA-2 — Status/payment columns lost their CHECK constraints in the rebuild** ✅
- **Category:** Data integrity
- **Evidence:** Legacy `20250617083939` had `CHECK` on `difficulty_level/category/status`; the effective rebuild `20251226011052:96-104,161-163` redefined them as bare `TEXT DEFAULT …` with **no CHECK**. Confirmed live: `package_bookings.status`/`payment_status` are nullable free-text. Seed data immediately inserts values (`category='luxury'`) the old CHECK rejected.
- **Impact:** RLS and app branch on `status='published'`/`'completed'`; a typo silently hides a package or corrupts state. Payment states are the worst place for free text.
- **Fix:** Add CHECK constraints (or enums) on `packages.status`, `package_bookings.status`, `package_bookings.payment_status`, `agency_payouts.status` via `ADD CONSTRAINT … NOT VALID; VALIDATE`.
- **Effort:** S · **Priority:** P1 · **Risk:** Silent state corruption.

---

**DATA-3 — `ON DELETE CASCADE` destroys financial history** 
- **Category:** Data integrity / compliance
- **Evidence:** `package_bookings.package_id/traveler_id … ON DELETE CASCADE` (`20251226011052:156-157`); `agency_payouts.agency_id … CASCADE` (`20251226023652:17`); packages→agency CASCADE; reviews cascade off bookings/packages/travelers. No soft-delete (`deleted_at`) anywhere. Agencies *can* delete their own packages (RLS allows it).
- **Impact:** An agency deleting a package silently deletes every booking — including **paid, confirmed** ones — plus their reviews. Deleting a user cascades to bookings→reviews. Payouts vanish with the agency.
- **Fix:** Bookings/payouts → `ON DELETE RESTRICT`; use `status='archived'` soft-delete for packages; snapshot or `SET NULL` for reviews.
- **Effort:** M · **Priority:** P1 · **Risk:** Irrecoverable loss of financial/audit records.

---

**OPS-1 — No CI/CD, no automated gates** 
- **Category:** DevOps
- **Evidence:** No `.github/` (verified), no pre-commit hooks, no `typecheck` script in `package.json`, `build` has no `tsc &&` step. Lint weakened: `eslint.config.js:26` sets `no-unused-vars: off`.
- **Impact:** Nothing prevents a broken build (or the 30 existing tsc errors) from shipping. ARCH-1/2 bugs reached "done" precisely because of this.
- **Fix:** GitHub Actions running `eslint` + `tsc --noEmit` + `vitest run` + `vite build` on PR; add `typecheck` script.
- **Effort:** S · **Priority:** P1 · **Risk:** Broken code ships undetected.

---

**OPS-2 — TypeScript strictness effectively disabled; 30 tsc errors ship** 
- **Category:** Maintainability / correctness
- **Evidence:** `tsconfig.app.json`: `strict:false, noImplicitAny:false`; root adds `strictNullChecks:false`. ~60 `any`/`as any` sites; hand-written row interfaces (`usePackageDetails.ts:149 as unknown as`) duplicate generated `Database` types. `vite build` (SWC) never type-checks.
- **Impact:** The type system is decorative exactly where Supabase null-handling matters. Schema drift (ARCH-1/2) goes uncaught.
- **Fix:** Fix the 30 errors, add `tsc --noEmit` to CI, then ratchet `strict:true`. Derive row types from `Database[...]['Row']`.
- **Effort:** L · **Priority:** P1 · **Risk:** Silent runtime failures.

---

**OPS-3 — No observability: no error tracking, no alerting, no structured logs** 
- **Category:** Operations
- **Evidence:** No Sentry/Datadog/PostHog (grep). Edge functions log bare `console.error` (`create-booking:109,115`) — no request IDs, no correlation. 117 `console.*` calls across 40 files. When a function fails, nobody is notified.
- **Impact:** Silent failure is the default failure mode; production issues are invisible until a user complains.
- **Fix:** Sentry on the SPA; structured JSON logs + request IDs in edge functions; a log drain or at minimum scheduled review + alerting.
- **Effort:** M · **Priority:** P1 · **Risk:** Blind operations.

---

**ARCH-2 — Multiple agency pages query non-existent columns** ✅
- **Category:** Broken features
- **Evidence (all verified absent live):** `useAgencyTravelers.ts:36` selects `travelers.full_name`/`phone_number` (cols are `first_name/last_name/phone`); `useAgencyFeedback.ts:47` selects `reviews.status` + `travelers.full_name`; `useAgencyCalendar.ts:40` queries `travel_agencies.user_id`; `Gallery.tsx:34` uses bucket `agency-gallery`. Live: `reviews_status_col=0, travelers_fullname_col=0, agency_userid_col=0, agency_gallery_bucket=0`.
- **Impact:** Agency Travelers, Feedback, Calendar, and Gallery pages fail at runtime (400s / missing bucket). PRD claims Calendar "✅ Complete".
- **Fix:** Correct column/bucket references; create `agency-gallery` bucket + RLS if the gallery is in scope. Remove `any` casts masking these.
- **Effort:** M · **Priority:** P1 · **Risk:** Broken agency portal.

---

### MEDIUM

---

**SEC-5 — Storage upload path not constrained to the caller's folder** 
- **Category:** Storage authorization
- **Evidence:** `20251226011052:504-506` — INSERT policy checks only `bucket_id='package-media' AND auth.role()='authenticated'`; unlike UPDATE/DELETE (which check `(storage.foldername(name))[1]=auth.uid()`), INSERT does **not** pin the path to the caller. Clients build `${user.id}/...` but nothing enforces it.
- **Exploit:** Authenticated user uploads to `victimUID/x.jpg`; since DELETE is keyed on folder UID, planted files can't be removed by the victim; enables quota abuse. Bucket is public → world-readable.
- **Fix:** Add `AND (storage.foldername(name))[1]=auth.uid()::text` to the INSERT `WITH CHECK`; consider restricting to agencies.
- **NOTE (R2 migration):** Supabase Storage RLS is being replaced by **Cloudflare R2**, which has **no knowledge of Supabase auth**. The equivalent protection must be re-implemented as a **presigned-upload Edge Function**: it verifies the caller (and ownership) server-side, then issues a short-lived, path-scoped upload URL. This finding becomes "design the presigned-upload gatekeeper correctly" rather than "patch the policy." Do not expose an unrestricted R2 write path.
- **Effort:** S (Supabase patch) → M (R2 presigned gatekeeper) · **Priority:** P2 (folds into the R2 migration).

---

**SEC-6 — No file type/size validation on uploads** 
- **Evidence:** `MediaStep.tsx:58-103` / `usePackages.ts:116-150` upload any `File`; no MIME/size checks client- or storage-side; bucket public.
- **Exploit:** Upload HTML/SVG-with-script to a public, inline-served bucket → stored-XSS; oversized-file abuse; public bucket also allows **listing** (Supabase linter WARN `public_bucket_allows_listing`).
- **Fix:** Set bucket `allowed_mime_types` + `file_size_limit`; validate client-side; remove the broad SELECT/listing policy.
- **NOTE (R2 migration):** On R2 the MIME/size enforcement moves into the **presigned-upload Edge Function** (validate declared content-type + size before issuing the URL) and/or a Cloudflare rule. R2 buckets are private by default and served through a Cloudflare custom domain — do not make the bucket publicly listable.
- **Effort:** S → M (folds into R2 gatekeeper) · **Priority:** P2.

---

**SEC-7 — No CSP or security headers** 
- **Evidence:** `index.html` has no CSP/X-Frame-Options/Referrer-Policy; loads remote Google Fonts; no host header config. Several `dangerouslySetInnerHTML` sinks exist (`chart.tsx:79`, Mapbox marker builders) — currently dev-controlled, but no backstop.
- **Fix:** Strict CSP + framing/referrer headers at the CDN/host layer (`_headers`/host config).
- **Effort:** M · **Priority:** P2.

---

**BUS-6 — Verification/suspension gates nothing** 
- **Evidence:** `is_verified=false` agencies publish packages and take bookings; `suspended` travelers can still book (`create-booking/index.ts:66-72` has no such check).
- **Fix:** Enforce verification/suspension in RLS and/or the booking edge function.
- **Effort:** M · **Priority:** P2.

---

**BUS-7 — Admin approval queue & activity log are placeholders** ✅ (seed-only)
- **Evidence:** `admin_pending_actions` approve/reject just sets status with **zero side effects** (`useAdminDashboard.ts:166`); `admin_activity_logs` only writer is the seed migration (fake "Sarah Johnson" entries, `20251226022633:75`) — no app code logs real events. `platform_stats` is seeded fiction with no writer (dead table).
- **Fix:** Wire pending-action approval to real effects; log real events via SECURITY DEFINER/edge functions; populate `platform_stats` via a scheduled rollup (`pg_cron`/edge function).
- **Effort:** L · **Priority:** P2 · **Risk:** Admin dashboards show fabricated data.

---

**ARCH-3 — React Query effectively unused; no pagination; client-side joins** 
- **Evidence:** Only `App.tsx:4` + `TravelerDashboard.tsx:7` import React Query; 29 hooks are manual `useEffect` fetchers (no caching, dedup, invalidation; race conditions on unmount). Zero `.range()` calls; `usePublishedPackages` fetches all packages incl. `package_media(*)` then paginates client-side (`PackagesList.tsx:97`). Admin hooks fetch whole tables and join in JS (`useAdminBookings.ts:56-80`, 4 sequential queries).
- **Impact:** Fine at 12 packages; O(table-size) growth; admin dashboard degrades first.
- **Fix:** Migrate to `useQuery`/`useMutation` with query-key conventions + central defaults; push filter/sort/pagination into PostgREST (`.range/.eq/.order`); use embedded selects and `head:true` counts.
- **Effort:** L · **Priority:** P2.

---

**DATA-4 — Missing FK indexes; RLS `initplan` inefficiency; policy bloat** ✅ (Supabase advisors)
- **Evidence (live performance advisor):** 3 unindexed FKs (`reviews.package_id`, `reviews.traveler_id`, `wishlist.package_id`); 20 `auth_rls_initplan` warnings (per-row `auth.uid()` re-eval); 28 `multiple_permissive_policies`; 13 `unused_index`.
- **Fix:** Add the 3 FK indexes (one-liners); wrap remaining `auth.<fn>()` in `(SELECT …)`; consolidate overlapping permissive policies; drop confirmed-unused indexes after observing `pg_stat_user_indexes`.
- **Effort:** M · **Priority:** P2.

---

**ARCH-4 — Non-atomic, error-ignoring package edit (data-loss risk)** 
- **Evidence:** `EditPackage.tsx:250-303` deletes then re-inserts routes/itineraries/media **without checking errors** and **non-transactionally**; a failure between delete and insert loses the package's itinerary/media. Logic is duplicated from `useCreatePackage.ts` (F9).
- **Fix:** Extract one `savePackageGraph()` backed by an RPC/edge function for atomicity.
- **Effort:** M · **Priority:** P2 · **Risk:** Silent content loss on edit.

---

**ARCH-5 — Split-brain error handling** 
- **Evidence:** Traveler hooks toast (with localized error-code mapping — good); all 8 admin + 5 agency hooks have no toast, only `console.error` + inconsistent local `error` rendering. App-level `ErrorBoundary` shows raw `error.message` to users (leak) and is the only boundary.
- **Fix:** Centralize via React Query `queryCache.onError` → localized toast; per-route boundaries; hide raw messages in prod.
- **Effort:** M · **Priority:** P2.

---

**ARCH-6 — mapbox-gl loads on the public listing; N WebGL contexts per page** 
- **Evidence:** `PackageCard.tsx:6` → `RouteMapThumbnail` statically imports `mapbox-gl` and instantiates a full WebGL map per card (up to 15/page; browsers cap ~8-16 contexts). A complete static-map URL builder (`utils/staticMap.ts`) is written but **imported nowhere**.
- **Fix:** Use `getStaticMapUrl` for card thumbnails; keep interactive GL only on the details page. **DECISION (2026-07-05):** image resizing/srcset will be delivered by **Cloudflare image resizing in front of R2** (not Supabase transforms), which also satisfies the "fast photos worldwide" goal for Gulf users.
- **Effort:** M · **Priority:** P2 · **Risk:** Jank / WebGL context-loss on the most public page.

---

**OPS-4 — Deployment uncodified; config ref drift** ✅
- **Evidence:** No `vercel.json`/`netlify.toml`/`wrangler.toml`/Dockerfile — deploy is manual local build. `supabase/config.toml` is a single line pointing to **`okqgtbzdftkssqswfybn`**, but the live project is **`saouviwryaswacjtfswc`** (drift). No `[functions]`/`[auth]` config codified; no staging environment.
- **Fix (DECISION 2026-07-05):** Deploy the SPA to **Cloudflare Pages** (with Cloudflare CDN/DNS); fix `config.toml` ref (`okqgtbzdftkssqswfybn` → `saouviwryaswacjtfswc`); add `supabase functions deploy` + `db push` to CI; stand up staging. Note Cloudflare CDN fronts the **site**, not the Supabase API — API rate-limiting/abuse controls (SEC-8) still live in Edge Functions. CDN caching applies only to static assets + public anonymous endpoints, never per-user data.
- **Effort:** M · **Priority:** P2.

---

**QA-1 — Effectively no test coverage on critical paths** 
- **Evidence:** 2 unit test files (`cn()`, formatters). Zero component/integration/e2e; edge functions and RLS policies untested. Vitest is correctly wired — barrier to adding tests is zero.
- **Fix:** RLS policy tests (traveler can't rewrite bookings — would have caught SEC-2), Deno tests for both edge functions, one Playwright golden journey.
- **Effort:** L · **Priority:** P2.

---

### LOW

- **DATA-5 — Money/rate columns unconstrained:** `agency_payouts.amount`, `platform_stats.total_revenue` have no `CHECK (>=0)`; `commission_rate` no `CHECK (0..1)`; `participants` no `CHECK (>0)`; no currency column; no `UNIQUE(package_id, day_number)` on itineraries. **S**.
- **DATA-6 — Agency rating denormalized but never synced:** `travel_agencies.rating/total_reviews` are seed-only fiction; the review trigger updates packages only. **S**.
- **DATA-7 — Untethered uuid columns:** `admin_pending_actions.assigned_to/resolved_by`, `content_pages.author_id`, `agency_payouts.processed_by` have no FK (can dangle). **S**.
- **SEC-8 — `create-booking` has no idempotency/rate limiting; CORS `*`:** duplicate/retry double-booking possible; wildcard origin. **S/M**.
- **SEC-9 — `has_role` SECURITY DEFINER callable by anon/authenticated** (Supabase linter WARN) — review whether RPC exposure is intended; **leaked-password protection disabled** + 6-char client-only min. **S**.
- **ARCH-7 — Feature-boundary cycles:** `home ↔ packages` (Header/Footer live in `features/home` but are app chrome); admin bookings routed from `features/admin` but lives in `features/bookings`. **S**.
- **ARCH-8 — `pickLocalized(row, field:string)` is stringly-typed** (typo → `undefined`, no compile error) and reactivity to language change is implicit. Type as `keyof R`; wrap in a `useLocalized()` hook. **S**.
- **ARCH-9 — Auth context smells:** `setTimeout(…,100)` race workaround in the auth callback; context value not memoized (re-renders all consumers); `error: any` signatures. **S**.
- **MISC:** dead `BookingWizard`/`BookingStep1-4`; do-nothing buttons (Download Voucher, Contact Support, View, Message); `Math.random()` media filenames (use `crypto.randomUUID`); listing wishlist hearts are UI-only despite a real `useWishlist`; `content_pages` CRUD exists but no public rendering (Destinations is a hardcoded 6-item list); env vars passed unvalidated to `createClient` (cryptic boot crash if missing).

---

## Phase 21 — Prioritized Implementation Roadmap

Ordered by dependency and risk. Each wave is releasable.

### Wave 0 — Critical security & integrity blockers (must fix before ANY launch) — ~1 week
| Order | ID | Item | Effort | Depends on | Status |
|---|---|---|---|---|---|
| 1 | SEC-1 | Lock down agency self-update (guard trigger + admin/service bypass) | S | — | ✅ done + verified 2026-07-05 |
| 2 | SEC-2 | Lock down traveler booking-update (drop policy + agency status-only guard) | M | — | ✅ done + verified 2026-07-05 |
| 3 | SEC-4 | Add missing admin RLS policies (agencies update, reviews update/delete) | S | — | ✅ done + verified 2026-07-05 |
| 4 | DATA-2 | Add CHECK on status & payment columns | S | — | ✅ done + verified 2026-07-05 |
| 5 | BUS-2 | DB-level booking capacity enforcement (per departure date) | M | DATA-2 | ✅ done + verified 2026-07-05 |
| 6 | DATA-3 | Change bookings/payouts to `ON DELETE RESTRICT` | M | — | ✅ done + verified 2026-07-05 |
| 7 | DATA-1 | Restore `travel_agencies`→`auth.users` FK (samples → real demo logins) | M | — | ✅ done + verified 2026-07-05 |
| 8 | ARCH-1 | Remove Guides page + hook (Deals/Messages deferred to Wave 4) | S | — | ✅ done 2026-07-05 (frontend) |

**✅ WAVE 0 COMPLETE (2026-07-05).** All 8 critical blockers resolved and verified against live project `saouviwryaswacjtfswc`; every migration mirrored in `supabase/migrations/`:
`…100000_sec1_agency_update_guard`, `…100100_sec2_booking_update_lockdown`, `…100200_sec4_admin_moderation_policies`, `…100300_data2_status_check_constraints`, `…100400_bus2_booking_capacity`, `…100500_data3_protect_financial_history`, `…100600_harden_guard_function_grants`, `…100700_data1_link_agencies_to_auth` (+ Guides frontend removal).

**DATA-1 result:** the 3 unlinked sample agencies (Desert Dreams, Mountain Escape, Ocean Voyages) are now real, verified demo agency accounts — login email = their existing address, **password `ToTravelDemo!2026` (rotate before launch)** — each retains its 4 packages, ratings, and verification; all 12 packages preserved, 0 orphans, FK re-attached with `ON DELETE CASCADE`. "Ask Tourist" (owner's real account) left untouched.

**Frontend (2026-07-05):** ARCH-1 Guides removed — deleted `pages/Guides.tsx` + `hooks/useAgencyGuides.ts`, removed the route and both nav entries (`AppSidebar.tsx`, `DashboardHeader.tsx`) + unused `UserCheck` import. Touched files typecheck clean; project `tsc` error count dropped ~30 → 24 (remaining errors are the Deals/Messages tables to be built in Wave 4, plus `useAgencyCalendar` under ARCH-2).

**Interim notes:** capacity is enforced per `(package_id, booking_date)` against `max_participants` — an interim guard until the real departures/inventory model (BUS-4) replaces the faked availability. DATA-2 deferred `packages.category`/`difficulty_level` (need wizard option lists) and `travel_agencies.status` (need approval value). DATA-3 left `package_bookings.traveler_id` as CASCADE pending an account-deletion/anonymization policy.

*Rationale: SEC-1/2/4 are one-to-few-line RLS changes that close live-verified exploits and should ship first. They also unblock trustworthy revenue reporting. ARCH-1 in Wave 0 is now just the Guides removal; Deals/Messages are a build effort moved to Wave 4.*

### Wave 0.5 — Storage migration to Cloudflare R2 (pre-launch, do while data is tiny) — ~3–5 days
*Prerequisites: R2 enabled ✅. Still blocked on: owner registers a **domain** (steps a-custom-domain + d image-resizing need it — no domain as of 2026-07-05; dev can use a temporary r2.dev URL meanwhile) and generates an **R2 API token** for step b.*
| Order | Item | Effort |
|---|---|---|
| a | ~~Create `totravel-media` R2 bucket (private)~~ ✅ done 2026-07-05 · **+ connect Cloudflare custom domain** (pending owner domain) | S |
| b | Presigned-upload Edge Function (auth + ownership + MIME/size checks → path-scoped URL) — carries SEC-5/SEC-6 | M |
| c | Rewrite the 3 storage call-sites (`MediaStep.tsx`, `usePackages.ts`, `Gallery.tsx`) off `supabase.storage` | M |
| d | Enable Cloudflare image resizing (satisfies ARCH-6 "fast photos") | S |
| e | Migrate the ~16 existing files; update `package_media.file_path`; create the missing `agency-gallery` equivalent bucket | S |

### Wave 1 — Make the product actually transact — ~2–3 weeks
| Order | ID | Item | Effort |
|---|---|---|---|
| 9 | BUS-1 | Integrate **Moyasar** (webhook = source of truth, Edge Function) | XL |
| 10 | BUS-4 | Remove fake availability/discounts or model real departures | M |
| 11 | BUS-3 | Booking-completion transition → unlocks reviews | M |
| 12 | BUS-5 | Payout calculation engine + ledger (per-agency `commission_rate`) | L |
| 13 | ARCH-2 | Fix agency pages querying wrong columns (Travelers/Feedback/Calendar) | M |

### Wave 2 — Operational safety net — ~1 week (parallelizable with Wave 1)
| Order | ID | Item | Effort |
|---|---|---|---|
| 14 | OPS-1 | CI: eslint + tsc --noEmit + vitest + build gate | S | ✅ done 2026-07-05 |

**OPS-1 delivered (2026-07-05):** `.github/workflows/ci.yml` runs on every push (`main`, `feat/**`) and PR. **Blocking:** `npm ci` → `vitest run` (`test:ci` script) → `vite build` — all green today. **Informational (`continue-on-error`):** `typecheck` (`tsc --noEmit -p tsconfig.app.json`, 24 errors) and `lint` (~70 errors, 67 in app code) — a pre-existing backlog surfaced but not yet blocking. Added `typecheck` + `test:ci` scripts to `package.json`. Flip the two informational steps to blocking as OPS-2 (the `any` cleanup) and the Wave 4 Deals/Messages tables drive their counts to zero. **Action for owner:** ensure GitHub Actions is enabled for the repo (Settings → Actions).
| 15 | OPS-2 | Fix tsc errors; enable strict | L | in progress |

**OPS-2 progress (2026-07-05):** Enabled `noFallthroughCasesInSwitch` (0 new errors). Fixed all 10 non-`any` lint errors (case-declaration blocks in `PackageWizard`, `prefer-const`, a `no-constant-binary-expression` in `utils.test.ts`, two `no-empty-object-type` in `ui/`, and the `require()` import in `tailwind.config.ts`). Typed `AuthContext`'s 5 `any`s (error results → `Error | PostgrestError | null` with a `toError` normalizer; update objects → generated `…['Update']` types). **Lint 70 → 55 errors** (all 55 remaining are `no-explicit-any`); typecheck steady at 24 with zero regressions; tests + build green. Remaining `any` burn-down, grouped: the package-wizard prop chain (~20, needs a shared `PackageFormData` type — highest value), `EditPackage` (8), misc singles (~13), and ~14 in Wave-4-blocked files (Deals/Messages/Calendar/Feedback/Travelers/Gallery) best done when those are rebuilt. Full `strict:true` measures at only 30 total errors but can't reach 0 until the Wave-4 tables exist.

---

## Package Wizard — Investigation & Fixes (2026-07-05)

Deep review of the create/edit wizard (all wizard-steps, `useCreatePackage`, `EditPackage`, `usePackageDetails`, SEO) against the backend contract.

### ✅ Fixed this session (WIZ)
- **WIZ-1 (Bug, data loss): itinerary never saved on create.** `ItineraryStep` emits `day`/`meals`; `useCreatePackage` reads `day_number`/`meals_included`; `PackageWizard.handleSubmit` passed itinerary **untransformed**, so rows hit the `day_number` NOT NULL constraint and failed inside a swallowed `toast.warning`. Now mapped in `handleSubmit`.
- **WIZ-2 (Bug): media `media_type`/`is_primary` written as `undefined`.** Form uses `type`/`isPrimary`; create-path passed media untransformed. Now mapped.
- **WIZ-3 (Prod hazard): "Add Sample Images" injected hardcoded Unsplash URLs** as real saved media (`MediaStep.addMockImages`). Removed.
- **WIZ-4 (Bug): EditPackage edit-lock / missing `destinations`.** Edit state omitted `basicInfo.destinations`, diverging from create and blocking step-1 validation for array-created packages. Added + reconstructed from the scalar `destination` on load.
- **Typed the wizard chain top:** new shared `src/features/packages/types/wizard.ts` (`PackageFormData` reusing the canonical `RouteData`); typed `PackageWizard`, `WizardStepContent`, `MediaStep` (8 `any`s cleared). Striped ~15 debug `console.log`s that leaked full form data (incl. Arabic) on every keystroke.

### ✅ WIZ-6 done (2026-07-05) — atomic `save_package` RPC
Replaced the non-atomic, duplicated JS save with one Postgres function
(`20260705110000_wiz6_save_package_rpc.sql`) doing the full multi-table upsert
in a single transaction. `useCreatePackage` and `EditPackage` now both call
`supabase.rpc('save_package', …)` via a shared payload builder
(`lib/savePackagePayload.ts`) — ~240 lines of duplicated multi-insert deleted.
Live-verified (as a demo agency): itinerary/routes/media all persist, Arabic
preserved, `featured` forced false (WIZ-8), ownership enforced, non-agency and
cross-agency writes rejected. Also fixed **WIZ-14** (routes were silently
dropped on create — the old `handleSubmit` never passed them). Publish flow
(WIZ-5, owner decision = admin approval): submitting sets `status='pending'`;
admins approve to `published` via their existing update policy.

### ⏳ Remaining findings (need decisions / larger scope)
- **WIZ-5 follow-up:** submit→`pending` is wired end-to-end, but the admin side still needs a "pending approval" queue/action in the admin packages UI, and the ReviewStep toggle copy should read "Submit for review" (not "Publish").
- **WIZ-7: EditPackage drops structured inclusions** (saves only `additionalInclusions`; never rebuilds the category grouping on load).
- **WIZ-8 (Security, M1): `featured` is agency-writable** via the wizard payload — should be platform-only.
- **WIZ-9: dead/unpersisted fields** collected but never stored: `pricing.currency`, `pricing.base_price` shadow, `originalPrice`/`discount`, `basicInfo.subtitle`/`highlights`/`rating`, itinerary `highlights`, `route.travelMode`/`showDistances`.
- **WIZ-10: `package_routes.name_ar`** is the one localized column with a DB slot but **no Arabic capture UI** in the route step.
- **WIZ-11: no `available_from`/`available_to` capture** — the public availability calendar is entirely faked (`useAvailability` random seats/discounts) because the wizard has no departures/date step.
- **WIZ-12 (validation):** only steps 1 & 4 validate; child-insert errors are swallowed and the user still sees "created successfully."
- **WIZ-13 (SEO):** detail page is strong (localized title/desc, canonical, en/ar hreflang, TouristTrip + BreadcrumbList JSON-LD) but: SPA client-render only (non-JS scrapers get nothing), `Offer` lacks `image` + `aggregateRating`, captions default to raw filenames (weak alt text), listing page has no `ItemList`.
- **Arch:** wizard uses per-step `useState` mirrors synced via effects (double-buffering) — the root cause of the `any`s and the edit round-trip bugs; a reducer or react-hook-form + the shared type would remove the class. Edit logic should move to a `useEditPackage`/`useUpsertPackage` hook symmetric with create.
| 16 | OPS-3 | Sentry + structured edge-function logs + alerting | M |
| 17 | OPS-4 | Codify deploy + fix config ref + staging env | M |
| 18 | QA-1 | RLS + edge-function + one e2e test | L |

### Wave 3 — Security hardening (round 2) — ~3–4 days
SEC-3 (agency PII projection), SEC-5 (storage path pinning), SEC-6 (upload validation), SEC-7 (CSP/headers), SEC-8 (idempotency/CORS/rate limit), SEC-9 (leaked-password protection, `has_role` exposure), BUS-6 (verification/suspension gating).

### Wave 4 — Business-logic completeness — ~1.5 weeks
BUS-7 (real admin approval effects + activity logging + `platform_stats` rollup), DATA-6 (agency rating sync), **ARCH-1 build-out: `deals` + `messages` tables, RLS, and realtime for Messages** (per the 2026-07-05 decision).

### Wave 5 — Performance & scalability — ~1 week
ARCH-3 (React Query + server-side pagination), DATA-4 (FK indexes, RLS initplan, policy consolidation), ARCH-6 (static maps on listing + image transforms), ARCH-5 (centralized errors).

### Wave 6 — Maintainability & long-term — ongoing
ARCH-4 (atomic package save), DATA-5/DATA-7 (constraints & FKs), ARCH-7/8/9 (boundaries, localization typing, auth context), MISC cleanup, DR runbook/backup verification, i18n key-parity CI.

---

## What could NOT be verified (stated explicitly, per the brief)

- **Live runtime behavior in a browser** — the "always errors" claims (ARCH-1/2) are proven by schema-vs-query mismatch + live DB checks, not by observing 400s in a running app.
- **Supabase plan tier** → backup existence, PITR, retention (not visible from repo).
- **Dashboard-only settings** — leaked-password protection (linter reports disabled), custom SMTP, email templates, Mapbox token URL restrictions, `package-media` server-side MIME/size limits.
- **Whether deployed edge functions match repo source** (manual deploys can drift; `verify_jwt=true` confirmed via API).
- **Whether the historical anon key** committed in git history (removed in `ae4e418`) was rotated (it's publishable, so low impact).
- **Any dashboard-created objects** (cron jobs, extra policies) not captured in migrations — none found affecting the above, but not exhaustively provable.
- **Actual bundle sizes** (no production build run) and **i18n en/ar key parity** (out of scope this pass).

---

*Prepared as a read-only production-readiness review. Top 8 items (Wave 0) are the launch gate.*
