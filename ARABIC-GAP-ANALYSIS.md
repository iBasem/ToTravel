# ToTravel — Arabic Gap Analysis (post-implementation)

**Date:** 2026-07-04 · **Branch audited:** `feat/arabic-first` (after all 6 localization stages)
**Question:** where does a user with Arabic active still see English — traveler, agency, admin — and how do we close each gap?

> **STATUS UPDATE (2026-07-04):** P0, P1, and P2 are implemented. Categories A (via `_ar` columns + bilingual wizard + `pickLocalized`), B (edge-function error codes + auth error mapping, deployed), C (all items), and D (Mapbox Arabic labels via `applyMapLanguage`) are closed. Remaining known limits: browser-native validation bubbles follow the browser language; user-generated content (reviews) stays in its authored language; MT-assist for the wizard is an optional follow-up.

Method: three role-scoped code sweeps (traveler/public, agency, admin) + automated key-coverage analysis + schema analysis + third-party surface review.

---

## Gap map — by category, worst first

### Category A — Database content (structural; the largest visible gap)

**What the user sees:** package titles, descriptions, destination names, inclusions/exclusions, itinerary day titles/activities, agency names/descriptions, media captions — all English, on every screen, for all three roles. This is now *the* dominant source of English in Arabic mode.

**Affected columns** (from generated Supabase types):

| Table | User-visible text columns |
|---|---|
| `packages` | title, description, destination, inclusions[], exclusions[], requirements, cancellation_policy, terms_conditions |
| `itineraries` | title, description, activities[], accommodation, meals_included, transportation |
| `package_media` | caption |
| `travel_agencies` | company_name, company_description, city, country |
| `content_pages` | title, content |
| `admin_activity_logs` | action_description (admin-only, lower priority) |

Precedent already in the schema: `package_routes.name_ar` exists and `RouteMap.tsx` already prefers it.

**Options:**

| Option | How | Pros | Cons |
|---|---|---|---|
| **A1. Sibling `_ar` columns** ⭐ recommended | `title_ar`, `description_ar`, … on `packages`/`itineraries`; wizard gets AR+EN inputs; display picks by language with EN fallback | Follows the existing `name_ar` precedent; trivial queries; RLS unchanged; typed by codegen | Scales to exactly 2 languages; ~15 columns of schema churn |
| A2. JSONB i18n columns | `title_i18n jsonb` = `{"en":…,"ar":…}` per field | One column per field; N languages | Harder filtering/search; needs read helpers; loses column-level typing |
| A3. Translations table | `package_translations(package_id, locale, title, description, …)` | Cleanest model for many languages; per-locale moderation | Joins everywhere; biggest refactor of hooks/RLS |
| A4. Machine-translation layer | Edge function auto-translates on save (Claude/DeepL) into whichever storage above; agency can edit | Zero agency burden; instant catalog coverage | Cost per save; MT quality needs a review flag |

**Recommendation:** A1 for `packages` + `itineraries` display fields (title, description, destination, inclusions, exclusions; itinerary title/description/activities), delivered with:
1. Bilingual inputs in the package wizard (two tabs: العربية / English) — agencies serving Arabic customers author both.
2. A `pickLocalized(row, field, lang)` helper in `src/lib` (returns `field_ar` when Arabic and present, else `field`).
3. Optional A4 as an assist: "ترجمة تلقائية" button in the wizard pre-fills the Arabic tab from English (flagged as machine-translated until edited).
4. `content_pages`: use row-per-locale instead (`slug + locale` unique) since pages are whole documents.

Effort: migration + types regen ~2h; wizard bilingual UI ~6h; display helper + call sites ~4h; MT-assist edge function ~4h (optional).

---

### Category B — Server-originated English (errors reach users verbatim)

**What the user sees:** English sentences inside Arabic toasts/alerts whenever the server rejects something.

| Source | Reaches user via |
|---|---|
| `supabase/functions/create-booking` — "Package not found", "Only travelers can create bookings", "Maximum N participants…" | `useCreateBooking.ts:53` toast |
| `supabase/functions/create-review` — same pattern | `useReviews.ts:131` toast |
| Supabase Auth `error.message` (e.g. "Email not confirmed", rate-limit messages) | `AuthPage.tsx:82,99` inline error |
| Generic passthroughs | `AgencyBookings.tsx:66`, `useCreatePackage.ts:180`, `Gallery.tsx:83,105`, `MediaStep.tsx:83` |

**Options:**

| Option | How | Pros | Cons |
|---|---|---|---|
| **B1. Error codes → i18n keys** ⭐ recommended | Edge functions return `{ code: "PKG_NOT_FOUND", message }`; client shows `t('serverErrors.' + code)` with the English message as last-resort fallback. Auth: map the ~6 known Supabase auth messages to keys | Correct language always; codes are stable API | Touch 2 edge functions + ~8 client sites |
| B2. Translate server-side | Edge functions read `Accept-Language` and return Arabic strings | No client mapping | Locale logic duplicated server-side; auth errors still English |

Effort for B1: ~3h (2 functions, one `serverErrors.*` section ≈ 15 keys, 8 call sites).

---

### Category C — Remaining code-level leaks (concrete file:line list)

**C1. Raw-key bugs — 22 `t('key')` references whose key exists in *neither* locale, so the UI literally shows `common.error` etc. (broken in both languages).** Worst offenders: `common.email`/`common.password` (AdminAuth), `common.error` (Deals ×5), `travelerDashboard.emptyWishlist*` (wishlist empty state), `travelerDashboard.noReviews*`, `common.noItemsFound`/`tourImage`/`unknownPackage` (TravelerBookings), `travelers.searchPlaceholder`, `common.participants`/`totalPrice` (CalendarView), `common.period`/`processed` (FinancialManagement), `common.newUsers`/`reports` (ReportsPage), `common.updateError`, `common.toggleSidebar` (sidebar ×3). **Fix: add the 22 keys (en+ar). ~1h.**

**C2. Date-picker months/weekdays are English** — `src/ui/calendar.tsx` never passes `locale` to `react-day-picker`. Every date picker (booking date, wizard dates) shows "July", "Mo Tu We" in Arabic mode. **Fix: pass date-fns `ar` locale + `dir` from i18n (one file). ~30min.**

**C3. Admin chart axes** — hardcoded `['Jan','Feb',…]` in `useAdminDashboard.ts:131`, `useAdminFinancials.ts:128`, `useAdminReports.ts:116` feed Recharts x-axes. **Fix: generate labels with `formatDate(new Date(2026, i, 1), 'MMM')`. ~30min.**

**C4. Destinations page content is a hardcoded English array** — `Destinations.tsx:20-87` (names, regions, descriptions, highlights) + `"All Regions"` (:92) + `"tours"` badge (:194). This page is effectively untranslated content. **Fix options: (a) move the array into i18n keys (fast, ~2h), (b) move destinations into a DB table with `_ar` columns (aligns with Category A, better long-term). Recommend (a) now, (b) when destinations become data-driven.**

**C5. Agency-side leaks** — `useAgencyTravelers.ts:70` + `Feedback.tsx:138` `toLocaleDateString()` (no locale); `Messages.tsx:54-56` hand-built "3h ago"/"2d ago" (use `formatRelativeTime`); fallback literals `'Unknown Package'`/`'Unknown'`/`'Private'` (`useAgencyCalendar.ts:84,87`, `useAgencyFeedback.ts:61-62`, `useAgencyTravelers.ts:58`); English toasts `useAgencyCalendar.ts:95`, `useDashboardStats.ts:66`; `MediaStep.tsx:49` sample captions; `AgencyBookings.tsx:188` → `formatDate`. **~2h.**

**C6. Admin cosmetics** — `ReportsPage.tsx:120` `toLocaleString()` → `formatNumber`; `ReviewManagement.tsx:212` hardcoded "All" filter button; `AdminSettings.tsx:174-177` currency dropdown lists USD/EUR/GBP/SAR — should list exactly the supported platform set (USD/SAR/AED) and note it is display-only until settings persistence exists. **~1h.**

**C7. Traveler cosmetics** — `TravelerProfile.tsx:29-42` sample data ("John Doe", "United States") shown as initial form values; `TourCard.tsx` fake "24"/"4.8" review numbers (honesty issue as much as i18n). **~1h.**

---

### Category D — Third-party surfaces

| Surface | Gap | Solution |
|---|---|---|
| **Mapbox map labels** | `streets-v12` renders place labels in English/local script (the RTL plugin fixes *shaping*, not *language*) | On style load in Arabic mode, switch label layers to Arabic: `map.setLayoutProperty(layer, 'text-field', ['coalesce', ['get','name_ar'], ['get','name']])` for symbol layers — or adopt Mapbox Standard style which accepts `language: 'ar'` directly. ~2h |
| **Browser-native form validation** | "Please fill out this field" bubbles follow the *browser* language, not the app | Either accept (browser-correct behavior), or move required-field validation into react-hook-form with `errors.requiredField` key. Recommend accepting for now; adopt RHF messages when zod validation lands |
| **`<input type="date">` etc.** | Native controls render per browser locale | Already mitigated — booking flows use the (soon-localized) DayPicker |
| **User-generated content** (reviews, special requests) | Written in whatever language the author used | Expected behavior. Optional later: "ترجم هذا التقييم" button via MT edge function |

---

## Recommended execution order

| Priority | Work | Impact | Effort |
|---|---|---|---|
| **P0** | C1 raw-key bugs + C2 DayPicker locale + C3 chart months | Broken keys visible today; every date picker & admin chart | ~2h |
| **P0** | C4 Destinations page (option a: i18n array) | A whole public page currently English | ~2h |
| **P1** | C5 + C6 + C7 remaining code leaks | Agency/admin polish | ~4h |
| **P1** | B1 server error codes → i18n | Every failure path speaks Arabic | ~3h |
| **P2** | A1 DB content: `_ar` columns + bilingual wizard + display helper | The catalog itself in Arabic — biggest visible win, needs product buy-in (agencies must author Arabic) | ~12h + optional MT assist ~4h |
| **P2** | D Mapbox Arabic labels | Map polish | ~2h |

After P0+P1 (~1.5 days), the only English an Arabic user sees is catalog content — which P2/A1 then closes.
