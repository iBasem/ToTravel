# ToTravel — Arabic-First Localization Audit & Execution Plan

**Scope:** Full codebase audit for Arabic-first product experience (i18n, RTL, Arabic copy quality, typography, SEO, accessibility, formatting)
**Date:** 2026-07-04
**Status:** IMPLEMENTED — all 6 stages landed on `feat/arabic-first` (2026-07-04). Currency is platform-configurable via `VITE_PLATFORM_CURRENCY` (USD/SAR/AED). Remaining known gaps: DB content (package titles/descriptions) is English-only; sitemap/robots domain placeholder needs the production domain; SPA prerendering for full crawler visibility is a separate future project.

---

## Part 1 — Discovery Findings (Phases 0–2)

### Ground truth

| Attribute | Finding |
|---|---|
| Stack | Vite 5 + React 18 + TS 5.5, Tailwind 3.4 + shadcn/Radix, TanStack Query, React Router v6, Supabase, i18next 25 + react-i18next |
| Structure | Feature-based: `src/features/{admin,agency,auth,bookings,home,packages,reviews,traveler}` + `src/ui` + `src/layouts` — ~195 files, ~26k LOC |
| Roles | Traveler (`/traveler/dashboard/*`), Agency (`/travel_agency/*`), Admin (`/admin/*`), plus public Home/Packages/Destinations |
| i18n today | i18next with EN + AR (947 keys each, full structural parity), localStorage+navigator detection, single flat `translation` namespace, both locales bundled |
| RTL today | `document.documentElement.dir` flip in `App.tsx`; declared "RTL-First Design System" in `index.css`; IBM Plex Sans Arabic loaded; `.rtl-flip` utility; 61 `isRTL` checks |
| Existing docs | `PRD.md` (product state) and `AUDIT.md` (production-readiness) are current and accurate |

### Overall verdict

The project is **genuinely RTL-aware already** — far better than a typical LTR-first app. Logical CSS properties outnumber physical ones 629:30 (21:1). The gaps are **systematic but bounded**: hardcoded strings in specific layers (hooks, package cards, filters), un-localized dates/currency, stiff Arabic copy with no plural forms, ~16 unflipped directional icons, and zero SEO localization.

**Effective Arabic experience today:** an Arabic user gets a mostly-RTL layout with Arabic chrome, but sees English package-card labels, English sort/filter options, English toast notifications, English weekday/month names, `$` prices, English page titles, and several arrows pointing the wrong way.

---

## Part 2 — Issues Found (Phases 3–16)

### 2.1 Translation coverage (Phase 3) — ~50–65% effective coverage

**~54+ hardcoded user-visible English strings.** Worst offenders, by impact:

| Area | Count | Files |
|---|---|---|
| Package card labels ("Duration", "Best Seller", "View tour", "Download Brochure", "Gold", "Price based on Private Double Room"…) | 25+ | `src/features/packages/components/PackageCard.tsx:99-227` |
| Sort/filter options ("Applied filters", "Total price: Lowest first"…) | 7 | `src/features/packages/components/filters/FiltersSidebar.tsx:65-90` |
| Toast messages in hooks | 12 | `useCreateBooking.ts:19,46`, `useWishlist.ts:70-121`, `useReviews.ts:50-129` |
| Enum display without i18n (categories title-cased, difficulty raw) | — | `PackagesList.tsx:46,59`, `TourHeader.tsx:38` |
| aria-labels hardcoded English | 8+ | `Pagination.tsx`, `RangeSlider.tsx`, `FiltersSidebar.tsx`, `HeaderSection.tsx:170` |
| Admin chrome ("Admin", "Administrator", "Admin Portal") | 3 | `AdminHeader.tsx:68,101,122` |
| Page titles/breadcrumbs ("Tours & Trips", "Packages") | 2+ | `PackagesList.tsx:199,205` |

Coverage by area: Auth ~85%, Reviews ~75%, Home/Traveler ~70%, Bookings ~65%, Agency ~60%, Admin ~55%, **Packages ~50% (worst — and it's the most traveler-visible surface)**.

### 2.2 Arabic quality (Phase 4) — decent-but-stiff MSA, with real bugs

- **Grammar bugs:** `hero.countries` = "دولة" (singular; must be "دول"); `tours.toursFound` = "رحلة تم العثور عليها" (singular for plural context).
- **No Arabic pluralization anywhere.** Arabic has 6 CLDR plural forms; the JSON has none (`key_one/_two/_few/_many/_other`). Count-based strings ("X people found helpful", "X bookings") render grammatically wrong for most counts.
- **Terminology inconsistency:** wishlist = 3 different terms (المفضلة / قائمة أمنياتي / محفوظة لاحقاً); tour = الجولة vs الرحلة interchangeably.
- **Tone:** correct but bureaucratic/documentation-like; a travel product should read warmer ("حدّد الأسعار…" over "تحديد الأسعار…").
- **Currency inside strings:** `"(+49$ للشخص)"` — hardcoded USD amounts embedded in Arabic copy.
- Punctuation is good (Arabic comma ، and question mark ؟ used correctly); Western digits used consistently.
- Thin sections: `errors` (3 keys), `ui` (8), `calendar` (9) — no validation-error or HTTP-error vocabulary.

### 2.3 RTL architecture (Phase 6, 9, 11) — strong base, specific breakages

**Functional bugs (P0):**
- `src/ui/carousel.tsx:88-99` — keyboard navigation inverted in RTL (ArrowLeft always = previous).
- Unflipped directional icons: `src/ui/calendar.tsx:55-56`, `src/ui/pagination.tsx:78,98`, `src/features/packages/components/Pagination.tsx:34,54`, `src/ui/breadcrumb.tsx:86` (separator), `src/ui/carousel.tsx:221,251`, `src/features/agency/components/CalendarView.tsx:72,78`.

**Visual/UX (P1):**
- Hardcoded `align="end"` / `align="start"`: `src/ui/LanguageSwitcher.tsx:28`, `ReviewManagement.tsx:266`, `BookingWidget.tsx:113`.
- Sidebar physical positioning: `src/ui/sidebar.tsx:304` (rail `-translate-x-1/2`), `:464,610,635` (`right-*` → `end-*`), `:694,726` (border-l, translate-x).
- `src/ui/navigation-menu.tsx:72` — `left-0` LTR assumption.
- Mapbox attribution/marker anchors not direction-conditional (`RouteMap.tsx:53,97,117`).

**Already correct (do not touch):** Sheet side handling, dropdown/context/popover Radix data-side animations, dialog centering, 11 icons already flipped via `rtl:rotate-180`/`.rtl-flip`, Mapbox NavigationControl positioning.

### 2.4 Formatting (Phase 15) — the biggest silent Arabic-UX failure

- **Dates:** `date-fns` `format()` is called in 11 files and **never receives the `ar` locale** — Arabic users see "Monday, March 4th". `CalendarView.tsx:68,174`, `DepartureCard.tsx:54-70`, `BookingModal`, etc.
- **Currency:** hardcoded `$` / `US$` in 10+ places (`BookingStep3.tsx:172-192`, `BookingStep4.tsx:194-201`, `BookingWidget.tsx:75,135`, `BookingModal.tsx:145,153`, `PackageCard.tsx:208-213`, `FiltersSidebar.tsx:109`, `DepartureCard.tsx:93-98`).
- **Numbers:** admin pages correctly use `Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US')`, but the traveler-facing surfaces use bare `toLocaleString()`. Note: `ar-SA` produces Arabic-Indic digits (٤٩) by default — currently inconsistent with the Western digits used in ar.json. **Needs a product decision** (recommendation below).
- **No centralized formatters** — every module reinvents; `src/lib` has no `formatCurrency/formatDate/formatNumber`.

### 2.5 Typography (Phase 8)

- IBM Plex Sans Arabic (300–700) + Inter loaded — good pairing choice.
- `[dir="rtl"]` line-height overrides exist (headings 1.5, body 1.8) — good.
- Gaps: render-blocking `@import` for fonts (should be `<link rel="preconnect">` + stylesheet link, or self-hosted with `font-display: swap`); no explicit heading scale; no Arabic letter-spacing reset on tracking utilities (`tracking-tight` harms Arabic script); both fonts always downloaded regardless of language.

### 2.6 SEO (Phase 13) — effectively zero localized SEO

- No per-page titles/descriptions anywhere (no helmet, no `document.title` calls) — every route is "ToTravel".
- No hreflang, no canonical, no `og:locale`/`og:image`, no sitemap.xml, no JSON-LD (TouristTrip/Product/Organization/BreadcrumbList).
- `index.html` hardcodes `lang="en"` (runtime-corrected by App.tsx, but crawlers without JS see English).
- Structural ceiling: client-rendered SPA — crawlers see an empty shell. Full fix requires prerendering/SSR (out of scope here; flagged in AUDIT.md too).

### 2.7 Accessibility (Phase 14)

- Radix gives a solid floor (roles, focus traps); 39 aria attributes present.
- Hardcoded English aria-labels (see 2.1); no skip-to-content link; unlabeled icon buttons (wishlist heart, notification bell, language globe).

### 2.8 i18n architecture (Phase 15)

- Sound foundation: instance isolation, localStorage persistence, fallback `en`.
- Gaps: single flat namespace (fine at this scale — keep, but split when >2k keys); no plural forms configured (i18next supports CLDR Arabic plurals natively — just needs `_one/_two/_few/_many/_other` keys); both locales in the entry bundle (~acceptable at current size; revisit if locales grow); no integration between i18n and date/number formatting.

---

## Part 3 — Execution Roadmap (Phase 17)

### Priority matrix

| Priority | Theme | Why |
|---|---|---|
| **P0** | Locale-aware dates + centralized formatters | Every Arabic screen shows English dates today |
| **P0** | Extract hardcoded strings (toasts, PackageCard, filters, enums) | Most-visible English leakage |
| **P0** | RTL functional fixes (icons, carousel keyboard, aligns) | Broken interactions in RTL |
| **P0** | Arabic copy bugs + plural forms | Grammatically wrong strings in production |
| **P1** | Arabic copy revision (glossary, tone, consistency) | Native-quality feel |
| **P1** | Currency strategy + display | Hardcoded USD everywhere |
| **P1** | SEO layer (per-page meta, hreflang, JSON-LD, sitemap) | Zero localized SEO today |
| **P2** | Typography polish (font loading, heading scale, tracking) | Refinement |
| **P2** | A11y (translated aria-labels, skip link) | Compliance + quality |
| **P2** | Sidebar/nav-menu logical-property cleanup | Edge-case polish |

### Stage 1 — Foundation (no visual change; ~6h)

1. Create `src/lib/formatters.ts`: `formatDate`, `formatCurrency`, `formatNumber`, `formatRelativeTime` — all reading `i18n.language`, date-fns `ar` locale imported. Unit-tested.
2. Decide + encode numeral policy (recommendation: **Western digits with Arabic locale formatting** — `ar` with `-u-nu-latn`, matching current ar.json convention and regional fintech norms).
3. Add plural-form support: convert count-based keys to i18next `_zero/_one/_two/_few/_many/_other` suffixes in both locales.
4. Replace font `@import` with preconnect + link tags in `index.html`; add `font-display: swap`.

### Stage 2 — String extraction (P0; ~12h)

5. Extract all toast messages from hooks → `toasts.*` keys (12 strings, 3 hooks).
6. PackageCard: 25+ labels → `packageCard.*`; wire enums through `t('categories.*')` / `t('difficulty.*')` (keys already exist).
7. FiltersSidebar sort/filter options → `tours.filters.*`.
8. aria-labels, admin chrome, breadcrumbs, page titles → keys.
9. Replace all hardcoded `$`/`US$` with `formatCurrency()`; remove `$49`/`$35` amounts from ar.json/en.json strings (interpolate instead).
10. Route all date-fns `format()` calls through `formatDate()`.

### Stage 3 — RTL fixes (P0/P1; ~8h)

11. Add `rtl:rotate-180` to the 16 unflipped icons (calendar, both paginations, breadcrumb separator, carousel arrows, CalendarView).
12. Fix carousel keyboard mapping for RTL (`src/ui/carousel.tsx:88-99`).
13. Make hardcoded `align` props direction-aware (LanguageSwitcher, ReviewManagement, BookingWidget).
14. Sidebar: `right-*` → `end-*`, rail translate, sub-menu border-l → border-s; navigation-menu `left-0` → `start-0`; HeroGallery counter `left-1/2` → logical centering.
15. Mapbox attribution position conditional on dir.

### Stage 4 — Arabic copy revision (P1; ~10h)

16. Fix grammar bugs (دولة → دول, toursFound plural, etc.).
17. Terminology glossary, applied across ar.json: الرحلة (traveler-facing tour), الباقة (package), قائمة المفضلة (wishlist, single term), الحجز, الوجهة, المرشد, التقييم.
18. Tone pass: warm imperative UI voice for traveler surfaces, professional for agency/admin. No literal calques.
19. Fill thin sections: errors (validation, network, 404), ui, calendar month names.

### Stage 5 — SEO + a11y (P1/P2; ~8h)

20. Lightweight `<Seo>` component (react-helmet-async or a 30-line hook): per-page localized title/description, `og:*`, `og:locale` + alternate, canonical, hreflang (en/ar via `?lng=` or subpath — decision below).
21. JSON-LD: Organization (Home), TouristTrip/Product + AggregateRating (PackageDetails), BreadcrumbList.
22. `public/sitemap.xml` (static routes) + robots reference.
23. Skip-to-content link; translate all aria-labels; label icon-only buttons.

### Stage 6 — QA & verification (~8h)

24. Per-screen RTL visual pass (dev-server preview screenshots in ar): Home, PackagesList, PackageDetails, booking flow, all three dashboards.
25. Unit tests for formatters + plural rendering (counts 0,1,2,3,11,100).
26. `npm run build` + bundle-size check (no regression beyond font strategy change).
27. Lighthouse pass on Home + PackageDetails in both languages.

**Total estimate: ~50h across 6 stages.** Each stage is independently shippable and revertible (git per-stage commits).

### Dependencies & risks

| Risk | Mitigation |
|---|---|
| `ar-SA` Intl produces Arabic-Indic digits, ar.json uses Western | Explicit numeral policy in formatters (Stage 1, item 2) |
| Plural-key rename breaks existing `t()` call sites | Codemod + grep verification; fallback keys retained one release |
| Icon flipping applied to non-directional icons | Only flip semantic direction icons; globally-recognized icons untouched |
| SEO meta invisible to non-JS crawlers (SPA limit) | Documented ceiling; prerendering proposed as separate future project |
| Bundle growth from date-fns `ar` locale | Import single locale module (~3kB gzip) |

### Rollback strategy
Each stage = one commit on a `feat/arabic-first` branch off `develop`. Any stage reverts cleanly; no DB/schema/API changes anywhere in this plan.

### Acceptance criteria
1. Zero user-visible English strings when `lng=ar` (verified by screen sweep).
2. Dates, numbers, currency all render via locale-aware formatters; no hardcoded `$`.
3. All directional icons/controls behave correctly under `dir="rtl"` including keyboard.
4. Count-based strings grammatically correct for 0/1/2/3–10/11+ in Arabic.
5. Every route has localized title + description + hreflang; PackageDetails carries JSON-LD.
6. Terminology consistent per glossary; native-reviewer sign-off on revised ar.json.
7. Build passes, tests pass, bundle within +5% of current.

---

## Decisions needed before implementation

1. **Numerals:** Western digits (1234) with Arabic formatting — recommended — or Arabic-Indic (١٢٣٤)?
2. **Currency:** keep USD-only (formatted per locale), or introduce a configurable platform currency (SAR/AED) now? (Recommendation: locale-aware USD now; multi-currency is a product feature, not localization.)
3. **URL strategy for hreflang:** query param (`?lng=ar`, zero routing change — recommended for now) vs `/ar/` path prefix (better SEO, requires router restructure).
4. **Scope approval:** all 6 stages, or P0 stages (1–3) first?
