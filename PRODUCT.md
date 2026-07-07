# Product

## Register

product

> Default register is **product**: most surfaces are workflow UI (marketplace browsing/booking, agency dashboard, admin console). Override to **brand** per-task only for the public home page and any future marketing/landing surfaces.

## Users

**Travelers** — English- and Arabic-speaking consumers (Middle East–focused, many browsing in Arabic RTL, often on mobile). They arrive to browse tour packages, compare itineraries and prices, book a trip for specific dates and party size, and later manage bookings, wishlists, and reviews from their dashboard. Context: leisure planning — exploratory at first (browsing, filtering by category/difficulty/price), then transactional (booking) where trust and clarity decide whether they commit.

**Travel agency staff** — small tour operators managing their business on the platform, mostly desktop. Their jobs: create and publish packages through a multi-step wizard (itinerary, route map, media, pricing), track incoming bookings on a calendar, update booking statuses, monitor reviews and basic analytics. Context: repetitive operational work, done daily — efficiency and scannability matter more than delight.

**Platform admins** — internal operators overseeing users, agencies, packages, bookings, and financials from a hidden console. Dense-data workflows: tables, stats, activity logs, moderation queues.

## Product Purpose

ToTravel is a multi-tenant tour marketplace connecting travel agencies with travelers. Agencies get a self-serve back office to publish and manage tour packages; travelers get a bilingual (EN/AR) storefront to discover, book, and review tours. The platform succeeds when a traveler completes a booking without hesitation and an agency can run its daily operations without training. Revenue model is bookings-driven (payments integration is on the roadmap — see PAYMENTS-GOLIVE.md), so every design decision on the traveler side ultimately serves booking conversion, and every agency-side decision serves listing quality and responsiveness.

## Brand Personality

**Trustworthy, warm, worldly.**

- Voice: confident and helpful, never salesy. Real information (dates, prices, inclusions, cancellation terms) presented plainly is the trust currency of a booking platform.
- Emotional goals — traveler side: anticipation and confidence ("this trip is real, well-run, and worth it"). Agency/admin side: calm control ("I can see the state of my business at a glance").
- The product is bilingual by identity, not as an afterthought: Arabic/RTL layouts must feel designed, not mirrored. Typography carries the brand in both scripts (dedicated `--font-arabic` stack exists).

## Anti-references

- **Generic travel-brochure clichés** — stock sunset heroes with "Discover Amazing Adventures" copy. (Current i18n strings lean this way — "Discover amazing places", "unforgettable memories" — tighten toward specific, concrete value when touching copy.)
- **OTA clutter (Booking.com / low-cost airline checkout patterns)** — urgency banners, fake scarcity ("3 people are looking!"), countdown timers, stacked promo badges. This platform sells trust; manufactured pressure destroys it. (A fabricated discount was already removed from listing cards once — never reintroduce that pattern.)
- **Generic admin-template dashboards** — wall-to-wall stat cards with meaningless sparklines, rainbow chart palettes, dense sidebars of dead links. Agency and admin screens should show only what drives an action.
- **"Mirrored English" Arabic** — RTL that flips layout but keeps LTR-designed line lengths, truncation, and icon directions. Arabic is a first-class locale, not a translation layer.

## Design Principles

1. **Trust before delight.** On any booking-path surface, clarity of price, dates, inclusions, and status beats visual flourish. Never let decoration compete with the information a traveler needs to commit money.
2. **Two scripts, one brand.** Every surface must hold up in Arabic RTL and English LTR equally — check both before calling anything done. If a layout only works in one direction, it isn't done.
3. **Browse like a magazine, manage like a tool.** Traveler-facing discovery (home, listings, package details) earns richer imagery and evocative pacing; agency and admin dashboards stay quiet, scannable, and fast. Don't let the registers bleed into each other.
4. **State honesty.** The platform has real lifecycle states (draft/published, pending/confirmed/cancelled) and real gaps (features in progress). Design every empty, loading, and error state deliberately; never fake data, ratings, or availability.
5. **One pattern per job.** The codebase standardizes on shadcn/ui primitives, TanStack Query loading patterns, and shared EmptyState/Toast components — extend these rather than inventing parallel patterns per page.

## Accessibility & Inclusion

- **Target WCAG 2.1 AA** across the platform: ≥4.5:1 body-text contrast, visible focus states, full keyboard operability (Radix primitives provide the base — don't break it with custom overrides).
- **RTL/LTR parity is an accessibility requirement here, not a nice-to-have**: direction-aware icons (chevrons, arrows), logical properties over physical margins where feasible, and Arabic line-height/font-size tuned for the Arabic type stack.
- Both light and dark themes are supported (`next-themes`) — verify contrast in both.
- Date, currency, and number formatting must respect locale; booking flows must be forgiving (clear validation, no dead-end errors) for users completing them in a second language.
- Respect `prefers-reduced-motion` for any hero/scroll animation on brand surfaces.
