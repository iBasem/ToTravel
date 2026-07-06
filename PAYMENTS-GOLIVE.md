# Moyasar Payments — Go-Live Checklist

The integration is built and deployed but **inert until you set the secrets below** —
the webhook fail-closes (returns 503) and refuses to mark any booking paid until
`MOYASAR_WEBHOOK_SECRET` is configured. Work top to bottom.

Project ref: `saouviwryaswacjtfswc`
Webhook URL: `https://saouviwryaswacjtfswc.supabase.co/functions/v1/moyasar-webhook`

## What's already built & deployed
- **DB:** `payments` ledger table (RLS: travelers see their own, admins all) + `package_bookings.payment_status`/`payment_reference` updated only by the webhook.
- **Edge functions (live):**
  - `create-payment` (JWT-protected) — creates a Moyasar **invoice** server-side from the booking's amount (client never sends the price) and returns its hosted URL.
  - `moyasar-webhook` (`verify_jwt=false`) — verifies Moyasar's `secret_token`, then idempotently marks the payment + booking paid. **Sole authority for `paid`.**
- **Frontend:** "Pay now" button on unpaid bookings → redirect to Moyasar → return to `/payment/callback` which polls the real booking status.

---

## 1. Get your Moyasar API keys
Moyasar dashboard → **Settings → API keys**. You have two pairs (test + live). Start with **test**.
- Publishable key (`pk_test_…`) — not needed for the hosted-invoice flow, keep for later.
- **Secret key (`sk_test_…`)** — needed below.

## 2. Choose a webhook shared secret
Invent a long random string (e.g. `openssl rand -hex 32`). Call it `WEBHOOK_SECRET`.
It must be **identical** in step 3 and step 4.

## 3. Set the Supabase Edge Function secrets
Dashboard → **Project Settings → Edge Functions → Secrets** (or CLI). Add:

| Secret | Value |
|---|---|
| `MOYASAR_SECRET_KEY` | your `sk_test_…` (later `sk_live_…`) |
| `MOYASAR_WEBHOOK_SECRET` | the `WEBHOOK_SECRET` from step 2 |
| `APP_URL` | your app's base URL, no trailing slash — for now `https://totravel.pages.dev` |

CLI equivalent:
```
supabase secrets set MOYASAR_SECRET_KEY=sk_test_xxx MOYASAR_WEBHOOK_SECRET=xxx APP_URL=https://totravel.pages.dev --project-ref saouviwryaswacjtfswc
```
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.)

## 4. Register the webhook in Moyasar
Moyasar dashboard → **Settings → Webhooks → Add**:
- **URL:** `https://saouviwryaswacjtfswc.supabase.co/functions/v1/moyasar-webhook`
- **Shared secret:** the same `WEBHOOK_SECRET` from step 2
- **Events:** `payment_paid` (and `payment_failed` if available)

## 5. Currency (important for KSA)
Payments are charged in **SAR**. Make sure displayed prices match what's charged:
set `VITE_PLATFORM_CURRENCY=SAR` in the app's build env (currently defaults to USD).
Otherwise a package shown as "$1,000" is charged "﷼1,000".

## 6. Test the full flow (test mode)
1. Deploy the app with the env from step 5, log in as a traveler, create a booking.
2. Open **My bookings → Pay now** → you land on Moyasar's hosted page.
3. Pay with a Moyasar **test card** (see Moyasar docs, e.g. `4111 1111 1111 1111`, any future expiry, any CVC; mada/Apple Pay in test as documented).
4. You're redirected to `/payment/callback` → it should show **Payment successful** within a few seconds.
5. Verify in the DB: `package_bookings.payment_status = 'paid'`, `status = 'confirmed'`, and a `payments` row with `status = 'paid'` and the Moyasar payment id.

**Quick webhook health check** (before real payments): with the secret set, a POST
with the wrong `secret_token` must return **401**, and a correct one with an unknown
`invoice_id` returns **200 `ignored`**. Before the secret is set it returns **503**.

## 7. Go live
- Swap `MOYASAR_SECRET_KEY` to `sk_live_…` (and re-point the webhook if Moyasar separates test/live).
- When you buy the real domain, update `APP_URL` to it and re-test the callback.

## Notes / current limitations
- **Refunds** are not automated yet — an admin marking a booking refunded doesn't call Moyasar's refund API. That's the next payments task.
- The hosted-invoice flow keeps card data entirely on Moyasar (lightest PCI burden).
- The webhook is idempotent (safe to receive the same event twice) and never trusts the client — only Moyasar with the correct shared secret can flip a booking to paid.
