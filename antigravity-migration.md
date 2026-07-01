# Tour Vendor Hub - Migration from Lovable.dev

This document provides a comprehensive overview of the codebase and step-by-step instructions for disconnecting Lovable.dev dependencies and running this project in a local development environment.

---

## 📋 Codebase Overview

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 18 with TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS with shadcn/ui components |
| **State Management** | React Query (@tanstack/react-query) |
| **Routing** | React Router DOM v6 |
| **Backend/Database** | Supabase (PostgreSQL + Auth + Storage) |
| **Form Handling** | React Hook Form + Zod validation |
| **Internationalization** | i18next |

### Project Structure

```
tour-vendor-hub/
├── src/
│   ├── App.tsx                 # Main application with routing
│   ├── main.tsx                # Entry point
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (52 components)
│   │   ├── auth/              # Authentication components
│   │   ├── home/              # Landing page components
│   │   ├── layout/            # Layout wrappers (Dashboard, Admin, Traveler)
│   │   ├── packages/          # Tour package components
│   │   └── booking/           # Booking-related components
│   ├── pages/
│   │   ├── admin/             # Admin dashboard pages (10 pages)
│   │   ├── travel_agency/     # Agency dashboard pages (12 pages)
│   │   └── traveler/          # Traveler dashboard pages (5 pages)
│   ├── hooks/                  # Custom React hooks (21 hooks)
│   ├── contexts/               # React contexts (AuthContext)
│   ├── integrations/supabase/  # Supabase client & types
│   ├── i18n/                   # Internationalization config
│   └── lib/                    # Utility functions
├── supabase/
│   ├── config.toml            # Supabase local config
│   └── migrations/            # Database migrations (16 migrations)
├── public/                    # Static assets
└── Configuration files        # Vite, Tailwind, TypeScript, ESLint
```

### User Roles & Route Structure

| Role | Base Path | Description |
|------|-----------|-------------|
| **Public** | `/`, `/packages`, `/destinations` | Public-facing pages |
| **Traveler** | `/traveler/dashboard/*` | Traveler bookings, wishlist, reviews |
| **Agency** | `/travel_agency/*` | Package management, bookings, calendar |
| **Admin** | `/admin/*` | User management, reports, settings |

### Key Features
- ✅ Multi-role authentication (admin, agency, traveler)
- ✅ Tour package CRUD with image gallery
- ✅ Booking management system
- ✅ Admin analytics dashboard
- ✅ Dark/Light mode support
- ✅ Multi-language support (i18n)

---

## 🔧 Lovable.dev Dependencies

### Files & Dependencies to Remove/Modify

| File | Lovable Reference | Action Required |
|------|------------------|-----------------|
| [package.json](file:///d:/tour-vendor-hub-1/package.json) | `lovable-tagger` (L83) | Remove dependency |
| [vite.config.ts](file:///d:/tour-vendor-hub-1/vite.config.ts) | `componentTagger` import & usage (L4, L15) | Remove import & plugin |
| [index.html](file:///d:/tour-vendor-hub-1/index.html) | Meta tags (L7-8, L11, L13, L16-17) | Update with your branding |
| [README.md](file:///d:/tour-vendor-hub-1/README.md) | All content | Replace entirely |

---

## 🚀 Step-by-Step Migration Guide

### Step 1: Remove `lovable-tagger` Dependency

The `lovable-tagger` is a Vite plugin used by Lovable for development tracking.

**Edit `package.json`** - Remove line 83:
```diff
  "devDependencies": {
    ...
-   "lovable-tagger": "^1.1.7",
    ...
  }
```

### Step 2: Update `vite.config.ts`

**Remove the Lovable import and plugin:**

```diff
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react-swc";
  import path from "path";
- import { componentTagger } from "lovable-tagger";

  export default defineConfig(({ mode }) => ({
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
-     mode === 'development' &&
-     componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }));
```

**Cleaned version:**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Step 3: Update `index.html` Meta Tags

**Replace Lovable branding with your own:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tour Vendor Hub</title>
    <meta name="description" content="Your tour management platform" />
    <meta name="author" content="Your Company Name" />

    <meta property="og:title" content="Tour Vendor Hub" />
    <meta property="og:description" content="Your tour management platform" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/og-image.png" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@your_handle" />
    <meta name="twitter:image" content="/og-image.png" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 4: Replace README.md

Create a new README with your project documentation.

### Step 5: Clean Install Dependencies

```bash
# Delete existing node_modules and lockfiles
rm -rf node_modules
rm package-lock.json
rm bun.lockb  # if exists

# Fresh install
npm install
```

### Step 6: Configure Environment Variables

Ensure your `.env` file has the required Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

> **Note:** The current `.env` contains hardcoded Supabase credentials. You may keep them or replace with your own Supabase project.

### Step 7: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

---

## ✅ Migration Checklist

- [ ] Remove `lovable-tagger` from `package.json`
- [ ] Clean up `vite.config.ts` (remove import and plugin)
- [ ] Update `index.html` meta tags
- [ ] Replace `README.md` 
- [ ] Delete `node_modules`, `package-lock.json`, and `bun.lockb`
- [ ] Run `npm install`
- [ ] Verify `.env` configuration
- [ ] Run `npm run dev` and confirm app starts

---

## 📁 Key Configuration Files

| File | Purpose |
|------|---------|
| [components.json](file:///d:/tour-vendor-hub-1/components.json) | shadcn/ui configuration |
| [tailwind.config.ts](file:///d:/tour-vendor-hub-1/tailwind.config.ts) | Tailwind CSS with custom theme |
| [tsconfig.json](file:///d:/tour-vendor-hub-1/tsconfig.json) | TypeScript configuration |
| [eslint.config.js](file:///d:/tour-vendor-hub-1/eslint.config.js) | ESLint rules |

---

## 🗄️ Supabase Integration

The app uses Supabase for:
- **Authentication**: Email/password auth with role-based access
- **Database**: PostgreSQL with 16 migrations in `/supabase/migrations/`
- **Types**: Generated TypeScript types in `/src/integrations/supabase/types.ts`

**Client config:** [src/integrations/supabase/client.ts](file:///d:/tour-vendor-hub-1/src/integrations/supabase/client.ts)

---

## 🎨 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 📦 Deployment Notes

This is a client-side React application. Deploy the `dist/` folder (after `npm run build`) to any static hosting:
- Vercel
- Netlify  
- Cloudflare Pages
- AWS S3 + CloudFront
- GitHub Pages

For SPA routing, configure your host to redirect all routes to `index.html`.
