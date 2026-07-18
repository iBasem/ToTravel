-- Wave 1 (audit AGY-3 — docs/audits/agency-portal-audit-2026-07-18.md).
--
-- Demo accounts with static passwords (admin@totravel.demo, the demo agency
-- logins) are seeded by ordinary migrations. They are intentional for this
-- demo environment and MUST keep working here — no rotation. This migration
-- makes the demo-ness explicit and machine-checkable so a future production
-- pipeline can (a) exclude the demo-credential migrations and (b) assert
-- is_demo_environment() = false as a deploy gate.
--
-- PRODUCTION DEPLOY RULE (see docs/deploy-notes.md): exclude
--   20260705100700_data1_link_agencies_to_auth.sql (demo agency passwords)
--   20260707020200_demo_agency_passwords.sql
--   20260709120200_seed_demo_admin.sql
-- and every 20260707010* / 20260709000200 seed migration from the pipeline,
-- then verify: select public.is_demo_environment();  -- must be false

alter table public.platform_settings
  add column if not exists demo_mode boolean not null default false;

-- Self-detect: this environment is a demo iff the demo admin account exists.
update public.platform_settings
  set demo_mode = exists (select 1 from auth.users where email = 'admin@totravel.demo')
  where id = 1;

create or replace function public.is_demo_environment()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select demo_mode from public.platform_settings where id = 1), false)
$$;

-- Internal helper for guards/deploy checks; not a client-facing RPC.
revoke all on function public.is_demo_environment() from public, anon, authenticated;
