# Deploying ToTravel to Cloudflare Pages

The app is a static Vite SPA. The build is in `dist/` (produced by `npm run build`)
with all `VITE_*` env values baked in at build time. Backend (Supabase + edge
functions) is already deployed separately.

Project: `totravel` → `https://totravel.pages.dev`

> **The Cloudflare MCP connector cannot deploy Pages** — it only exposes R2, KV,
> D1, Workers, and docs. Use one of the three paths below.

---

## Option A — Wrangler with interactive login (fastest one-off)
Deploys the exact `dist/` already built locally (env baked in). No secrets to paste.

```bash
npx wrangler login                                   # opens a browser, click Allow (one-time)
npx wrangler pages deploy dist --project-name=totravel
```
After `wrangler login`, the assistant on this machine can also run the deploy
command for you (it uses the cached login).

## Option B — Wrangler with an API token (non-interactive / lets the assistant deploy)
Best if you want deploys without the browser step (CI, or so I can run it).

1. Cloudflare dashboard → **My Profile → API Tokens → Create Token**.
2. Use the **"Edit Cloudflare Pages"** template (or a custom token with
   **Account → Cloudflare Pages → Edit**). Scope it to your account.
3. Also copy your **Account ID** (Workers & Pages → right sidebar).
4. Set them as environment variables (do **not** paste tokens into chat):
   ```bash
   export CLOUDFLARE_API_TOKEN=xxxxxxxx
   export CLOUDFLARE_ACCOUNT_ID=xxxxxxxx
   ```
5. Deploy:
   ```bash
   npx wrangler pages deploy dist --project-name=totravel
   ```

## Option C — Git integration (recommended long-term: auto-deploy on push)
Cloudflare builds from the repo on every push — no local build/upload needed.

1. Dashboard → **Workers & Pages → `totravel` → Settings → Builds & deployments**
   → **Connect to Git** → GitHub repo `iBasem/ToTravel`.
2. Build settings:
   - **Production branch:** `develop` (where the current work lives) — or merge to `main` and use that.
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Environment variables** (Settings → Environment variables) — required, because
   `.env` is gitignored so the Cloudflare build has no values otherwise. Add for
   **Production** (and Preview):
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_PROJECT_ID` | `saouviwryaswacjtfswc` |
   | `VITE_SUPABASE_URL` | `https://saouviwryaswacjtfswc.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | *(from `.env`)* |
   | `VITE_MAPBOX_TOKEN` | *(from `.env`)* |
   | `VITE_PLATFORM_CURRENCY` | `SAR` |
4. Save → every push to the production branch auto-builds and deploys.

The `public/_redirects` file (`/* /index.html 200`) is committed, so SPA deep
links and the Moyasar `/payment/callback` return URL work on Pages.

---

## Recommendation
- **Right now:** Option A to get the latest build live in ~1 minute.
- **Ongoing:** set up Option C so pushes deploy automatically and you stop
  hand-uploading. Once C is live, remember `APP_URL` (the Supabase edge secret for
  the payment callback) should match the deployed origin.
