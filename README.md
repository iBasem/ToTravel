# Tour Vendor Hub

A comprehensive tour management platform connecting travel agencies and travelers — package creation and publishing, a multi-step booking flow, agency and admin dashboards, reviews, and wishlists. Fully bilingual (English / Arabic) with first-class RTL support.

## Tech stack

- **Build tool:** Vite
- **Language:** TypeScript
- **UI:** React 18, shadcn/ui (Radix primitives), Tailwind CSS
- **Routing:** React Router
- **Data/state:** TanStack Query
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Maps:** Mapbox GL (geocoding + route maps)
- **i18n:** i18next / react-i18next (EN/AR, RTL)
- **Testing:** Vitest + Testing Library

## Getting started

Requires Node.js 18+ and npm.

```sh
# 1. Install dependencies
npm install

# 2. Configure environment (see below)
cp .env.example .env   # then fill in the values

# 3. Start the dev server
npm run dev
```

## Environment variables

All client-side config uses Vite's `VITE_` prefix. Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe for the browser) |
| `VITE_MAPBOX_TOKEN` | Mapbox **public** token (`pk.*`) — add URL restrictions in the Mapbox dashboard |

> These are all publishable/client keys and are inlined into the browser bundle at build time. Never put secret keys in `VITE_*` variables. Set them in your host's environment for production builds.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite |

## Project structure

```
src/
  features/        # feature modules (self-contained: components, hooks, pages)
    admin/         # admin dashboard
    agency/        # agency dashboard
    auth/          # authentication
    bookings/      # booking flow
    home/          # public landing / listings
    packages/      # tour package creation + details
    reviews/       # reviews
    traveler/      # traveler dashboard
  integrations/    # external service clients (Supabase)
  layouts/         # shared layout shells (headers, sidebars)
  ui/              # shadcn/ui component library
  hooks/           # shared hooks
  i18n/            # translations + i18next config
  lib/             # shared utilities
  pages/           # top-level route entries
supabase/
  migrations/      # database migrations
```

## Backend

The database schema and migrations live in [`supabase/migrations`](supabase/migrations). See [`BACKEND-HOSTING-COMPARISON.md`](BACKEND-HOSTING-COMPARISON.md) for hosting options.

## Deployment

This is a static Vite build (`npm run build` → `dist/`) and can be hosted on any static host or platform (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, a container, etc.). Provide the environment variables above through your host's configuration.
