# Backend Hosting Decision — ToTravel (MVP)

**Question:** Should I use **Cloudflare as the backend** instead of Supabase, or **self-host Supabase on Hostinger**? Full comparison + alternatives.
**Context:** MVP, not large-scale. The app already runs on **managed Supabase** (Postgres + Auth + Storage + RLS) and has a working normalized schema and RLS policies.
**Date:** July 2026 (pricing verified against vendor pages this month — always re-check before committing).

---

## TL;DR — the honest answer

**Neither of your two options is the right move for an MVP.**

- **Self-hosting Supabase on Hostinger** trades a $0–25/month managed bill for **$4,800–9,600 of hidden first-year DevOps time**, and you personally become the DBA, backup operator, and security patcher. Wrong call for an MVP where your time should go into the product. ([QueryGlow](https://queryglow.com/blog/supabase-self-hosted), [DreamHost](https://www.dreamhost.com/blog/self-host-supabase/))
- **Replacing Supabase with Cloudflare (D1)** means abandoning Postgres for SQLite and **losing Row-Level Security and Supabase Auth entirely** — you'd rewrite every migration, re-implement auth, and re-do the security model. That's a full re-platform of a working backend, right when you should be shipping. Cloudflare's own ecosystem guidance says: for a marketplace with user accounts and RLS, **Postgres/Supabase is the better choice; D1 is for read-heavy, simple, edge-native apps.** ([DevToolReviews](https://www.devtoolreviews.com/reviews/supabase-vs-cloudflare-d1-comparison-2026))

**Recommended: stay on managed Supabase, and use Cloudflare for what it's genuinely best at** — host the frontend on **Cloudflare Pages** (free), and add the **trusted server tier** (the thing your audit said was missing) as a **Supabase Edge Function or a small Cloudflare Worker** to own pricing/payment logic. Optionally move images to **Cloudflare R2** later for zero egress fees. This is a hybrid that keeps your working code and fixes the real problem, without a rewrite.

---

## First, reframe the question

"Cloudflare vs Supabase" isn't apples-to-apples. Supabase is an **all-in-one backend** (database + auth + storage + auto-generated API + RLS). Cloudflare is a **build-your-own-backend toolkit** (compute + database + storage + CDN as separate primitives you assemble). Choosing Cloudflare doesn't replace Supabase with one thing — it replaces it with **four things you now have to wire together and secure yourself**:

| What Supabase gives you in one box | The Cloudflare equivalent you'd assemble |
|---|---|
| Postgres database | D1 (**SQLite**, not Postgres) |
| Auth (signup, login, JWT, sessions) | **Nothing built-in for consumer auth** — add a Worker + a library (Lucia) or a 3rd-party (Clerk/Auth0) |
| Row-Level Security (per-user data rules in the DB) | **Does not exist in D1** — you enforce every rule in Worker code |
| Object storage for images | R2 |
| Auto-generated REST API | You write Workers |
| Static site hosting | Pages |

So the real decision is: *keep the batteries-included backend, or hand-assemble one?* For an MVP, batteries-included wins almost every time.

---

## Option A — Cloudflare as the backend (Workers + D1 + R2 + Pages)

**What it is:** Run your app logic in Workers (edge functions), data in D1 (SQLite at the edge), images in R2, frontend on Pages.

**Pricing (2026):** Workers free = 100K requests/day; Paid = **$5/mo** for 10M requests + 30M CPU-ms. D1 free = 5 GB storage, 5M row-reads/day, 100K row-writes/day. R2 free = 10 GB storage, **and — importantly — $0 egress bandwidth** (reads cost $0.36/million ops). Pages = free static hosting on the same free tier. ([Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Cloudflare plans](https://www.cloudflare.com/plans/developer-platform/))

**Pros**
- Extremely cheap and scales to near-zero cost at MVP traffic.
- **Global edge performance** and a generous free tier.
- **R2 has no egress fees** — genuinely attractive for an image-heavy tour marketplace (Supabase/AWS charge for bandwidth).
- Workers give you exactly the **trusted server tier your audit flagged as missing** — a place to compute prices and handle payment webhooks that the client can't tamper with.

**Cons (the deal-breakers for *this* project)**
- **D1 is SQLite, not Postgres.** Your entire schema, 19 migrations, enums, triggers, and Postgres functions would need rewriting. SQLite lacks native `ENUM`, has weaker concurrent-write handling, and no `NUMERIC`-style money semantics you'd want for payments.
- **No Row-Level Security.** Your security model *is* RLS today. On D1 you re-implement every access rule as imperative checks inside Workers — more code, easier to get wrong, and exactly the surface where marketplace auth bugs happen. ([DevToolReviews](https://www.devtoolreviews.com/reviews/supabase-vs-cloudflare-d1-comparison-2026))
- **No auth.** Cloudflare Access is for Zero-Trust/internal-app gating, *not* consumer email/password signup. You'd bolt on Clerk/Auth0 (extra cost) or hand-roll auth in a Worker (extra risk).
- **No long-running transactions across Worker invocations** and per-query row limits — you must design for short atomic writes. Workable, but more design overhead. ([Architecting on Cloudflare](https://architectingoncloudflare.com/chapter-12/))
- **Weeks of re-platforming** a backend that already works — negative product value for an MVP.

**Verdict:** Great platform, wrong time. Adopt Cloudflare for **frontend + a Worker**, not as a Postgres/Auth/RLS replacement.

---

## Option B — Self-host Supabase on Hostinger VPS

**What it is:** Rent a Hostinger KVM VPS, run the full Supabase stack (~15 Docker containers: Postgres, GoTrue auth, PostgREST, Realtime, Kong, Studio, etc.) yourself.

**Hostinger VPS pricing (2026):** KVM 1 = $4.99/mo (1 vCPU, 4 GB); **KVM 2 = $8.99/mo (2 vCPU, 8 GB)** — realistic minimum for Supabase; KVM 4 = $14.99/mo (4 vCPU, 16 GB) — comfortable. AMD EPYC, NVMe, free dedicated IP + DDoS protection. ([SmartHostFinder](https://smarthostfinder.com/hostinger-vps-pricing/), [Hostinger](https://www.hostinger.com/vps-hosting)) Note the standard host caveat: teaser prices assume long prepay terms; renewals are higher.

**Pros**
- Full control and data ownership; potential data-residency compliance.
- Flat, predictable server cost; no per-MAU or usage metering.
- Cheap raw compute for the specs.

**Cons (why this is the wrong MVP call)**
- **The full Supabase stack needs ~8 GB RAM** (Postgres alone wants ~2 GB); KVM 1 won't do it comfortably, so you're at KVM 2+ minimum. ([QueryGlow](https://queryglow.com/blog/supabase-self-hosted))
- **You lose managed backups, point-in-time recovery, effortless upgrades, and multi-project Studio.** Every upgrade becomes your problem. ([Supabase self-hosting docs](https://supabase.com/docs/guides/self-hosting), [QueryGlow](https://queryglow.com/blog/supabase-self-hosted))
- **You now own:** server provisioning, OS/security hardening, Postgres maintenance, backups + disaster recovery, monitoring, and uptime. If the DB corrupts at 2am, that's you.
- **Hidden cost:** ~4–8 hours to harden (backups, monitoring, staging) + 1–2 hrs/month maintenance ≈ **$4,800–9,600 in first-year engineer time** at $100/hr. A $50–150/mo managed bill is usually cheaper than the labor of self-hosting until you're spending $200–300+/mo managed. ([QueryGlow](https://queryglow.com/blog/supabase-self-hosted), [StarterPick](https://starterpick.com/blog/self-hosted-vs-cloud-supabase-saas-2026))

**Verdict:** Only rational if you specifically need data control/residency **and** have DevOps skills to spare. For an MVP chasing product-market fit, it's a distraction and an availability risk.

---

## Option C — Stay on Managed Supabase (recommended baseline)

**Pricing (2026):** Free = 500 MB DB, **50K monthly active users**, 1 GB file storage, 5 GB egress, 500K edge-function calls; **projects pause after 1 week of inactivity**, 2 active projects max. Pro = **$25/mo per project**: 8 GB DB, 100K MAU, 100 GB storage, no pausing, **daily backups**, email support. ([Supabase pricing](https://supabase.com/pricing))

**Pros**
- **Zero migration** — your schema, RLS, auth, and storage already work.
- **Zero ops** — managed backups, upgrades, monitoring included.
- RLS + Auth + Storage + auto-API in one place, which is precisely what a marketplace with user accounts needs. ([DevToolReviews](https://www.devtoolreviews.com/reviews/supabase-vs-cloudflare-d1-comparison-2026))
- **Edge Functions** give you the trusted server tier for the payment/pricing fixes from the audit — no new vendor required.

**Cons**
- Free tier **pauses on inactivity** (fine for dev, not for a live launch → go Pro at launch).
- Egress/bandwidth is metered (a reason to consider R2/Cloudflare CDN for images later).
- Per-project pricing can add up with many environments.

**Verdict:** The path of least resistance and least risk for an MVP. Start Free to validate; flip to **Pro ($25/mo) at launch** for backups + no pausing.

---

## Option D — Alternatives worth knowing

| Platform | Model | Free tier (2026) | Fit for *this* marketplace |
|---|---|---|---|
| **Neon** | Serverless **Postgres** | 0.5 GB/project, 100 projects, scale-to-zero, Neon Auth 60K MAU, usage-based, no monthly floor | 🟢 Strong **if** you want Postgres on Cloudflare Workers — real Postgres (keeps relational schema), pairs well with a Worker tier. But you'd still add storage + more auth wiring. ([Neon pricing](https://neon.com/pricing)) |
| **Appwrite** | Open-source BaaS (Firebase-style) | **75K MAU**, 10 GB storage, unlimited projects; $15/member paid; self-host free | 🟡 Generous free tier, but a **re-platform** from Supabase and weaker relational/Postgres story. ([MetaCTO](https://www.metacto.com/blogs/supabase-competitors-alternatives-a-comprehensive-guide)) |
| **Firebase** | NoSQL (Firestore) | Spark: 1 GB, 50K reads/day; **Storage removed from free tier Feb 2026**; Blaze pay-as-you-go | 🔴 **Poor fit** — document/NoSQL model fights your normalized relational marketplace schema; Blaze costs spike with transaction volume. ([AgentDeals](https://agentdeals.dev/database-free-tier-comparison-2026)) |
| **Railway / Render** | Managed container/Postgres hosting | Usage-based / small free allowances | 🟡 A middle ground: managed Postgres + a Node/Express backend if you want a classic server without self-hosting Supabase's 15 containers. |

---

## Cost snapshot at MVP scale (rough, monthly)

| Setup | ~Monthly $ | Your ops burden | Migration effort |
|---|---:|---|---|
| **Managed Supabase (Free)** | **$0** | None | None |
| **Managed Supabase (Pro)** | **$25** | None | None |
| **Cloudflare Pages + Supabase + Worker/Edge Fn** *(recommended hybrid)* | **$0–25** | Minimal | Low (add a function; host frontend on Pages) |
| **Cloudflare full (Workers+D1+R2)** | **$0–5** | Medium (own auth + access rules) | **High (full re-platform)** |
| **Self-host Supabase on Hostinger KVM 2** | **$9 server** + **~$400–800/mo equivalent in your time** | **High** | Medium (stack setup + hardening) |

The cheapest *sticker price* (Cloudflare full / self-host) is the most expensive in **engineering time and risk** — the currency that actually matters for an MVP.

---

## Recommendation & concrete plan

**Keep managed Supabase. Use Cloudflare where it wins. Don't self-host, don't re-platform.**

1. **Frontend → Cloudflare Pages** (free, fast, global). Your Vite build deploys cleanly; this also gives you a place to run a Worker.
2. **Database / Auth / Storage → stay on Supabase.** Start Free; go **Pro ($25/mo) before public launch** for daily backups and no pausing.
3. **Trusted server tier → Supabase Edge Function *or* a Cloudflare Worker.** This is where you fix the audit's critical findings: compute `total_price` server-side, write `payment_status` only from the payment webhook, and gate reviews on completed bookings. This is the single highest-value change and requires **no vendor switch**.
4. **Images (later optimization) → Cloudflare R2** for zero egress fees once bandwidth becomes a real cost.
5. **Revisit only if** you hit a real constraint: heavy global read traffic (lean more into Cloudflare edge), strict data-residency law (then consider self-hosting with a proper DevOps budget), or Supabase costs crossing ~$200–300/mo (then run the self-host math again).

**Why this is the right MVP call:** it preserves your working Postgres + RLS + Auth, closes the security gaps with a small trusted function instead of a rewrite, adopts Cloudflare's genuine strengths (edge frontend, cheap zero-egress storage), and keeps your monthly cost between $0 and $25 — while your time stays on the product, not on being a part-time database administrator.

---

## Sources

- [Cloudflare — Workers & Pages pricing](https://www.cloudflare.com/plans/developer-platform/)
- [Cloudflare — Workers pricing docs](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare — D1 pricing docs](https://developers.cloudflare.com/d1/platform/pricing/)
- [Supabase vs Cloudflare D1 comparison 2026 — DevToolReviews](https://www.devtoolreviews.com/reviews/supabase-vs-cloudflare-d1-comparison-2026)
- [Architecting on Cloudflare — Ch.12 D1 at the edge](https://architectingoncloudflare.com/chapter-12/)
- [Supabase — Pricing](https://supabase.com/pricing)
- [Supabase — Self-hosting docs](https://supabase.com/docs/guides/self-hosting)
- [Supabase self-hosted honest limitations — QueryGlow](https://queryglow.com/blog/supabase-self-hosted)
- [Self-hosted vs Cloud Supabase for SaaS 2026 — StarterPick](https://starterpick.com/blog/self-hosted-vs-cloud-supabase-saas-2026)
- [Self-host Supabase on a VPS — DreamHost](https://www.dreamhost.com/blog/self-host-supabase/)
- [Hostinger VPS pricing 2026 — SmartHostFinder](https://smarthostfinder.com/hostinger-vps-pricing/)
- [Hostinger VPS hosting](https://www.hostinger.com/vps-hosting)
- [Neon — Pricing](https://neon.com/pricing)
- [Database free tier comparison 2026 — AgentDeals](https://agentdeals.dev/database-free-tier-comparison-2026)
- [Supabase alternatives (Firebase/Appwrite/Neon) — MetaCTO](https://www.metacto.com/blogs/supabase-competitors-alternatives-a-comprehensive-guide)
