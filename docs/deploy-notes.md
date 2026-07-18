# Deploy notes

## Demo credentials (audit AGY-3)

This repository's migration history seeds **demo accounts with static passwords**
(`admin@totravel.demo` and the demo agency logins). They are intentional for the
demo environment and must keep working there.

**Before any production / non-demo deploy:**

1. Exclude these migrations from the pipeline:
   - `20260705100700_data1_link_agencies_to_auth.sql` (demo agency passwords)
   - `20260707020200_demo_agency_passwords.sql`
   - `20260709120200_seed_demo_admin.sql`
   - the demo seed content: `20260707010000/010100/010200_seed_*.sql`,
     `20260709000200_seed_approve_active_demo_deals.sql`
2. After migrating, assert the deploy gate:
   ```sql
   select public.is_demo_environment(); -- must return false
   ```
   The flag lives in `platform_settings.demo_mode` and self-detects by the
   presence of the demo admin account (`20260718100200_wave1_demo_mode_flag.sql`).
3. Enable leaked-password protection in Supabase Auth (advisor warning).

## Edge function JWT verification (audit AGY-13)

`supabase/config.toml` pins `verify_jwt` per function. `moyasar-webhook` MUST
deploy with `verify_jwt = false` (Moyasar's callback carries no Supabase JWT;
the function authenticates via the in-body `secret_token` against
`MOYASAR_WEBHOOK_SECRET`). All other functions keep gateway JWT verification.
A clean deploy without these entries silently breaks payment reconciliation.
