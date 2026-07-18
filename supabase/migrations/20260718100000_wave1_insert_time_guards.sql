-- Wave 1 (audit AGY-1, AGY-2, AGY-6 server gate — docs/audits/agency-portal-audit-2026-07-18.md).
--
-- Both moderation guards were BEFORE UPDATE only, while RLS allows agencies to
-- INSERT rows directly: a raw REST insert could land status='published' /
-- featured=true packages (AGY-1) or approval_status='approved' deals (AGY-2),
-- bypassing admin review entirely. Recreate both guards to fire on INSERT too.
-- Also enforce the "≥1 upcoming departure before submitting for review" gate
-- server-side for the draft→pending transition (AGY-6): the save_package RPC
-- already gates its own submit path, but ManagePackages toggles status via a
-- direct UPDATE that skipped it. published→pending (the RPC's auto-demote on
-- edit) is intentionally NOT gated: a published package may have only past
-- departures and editing it must not dead-end.

create or replace function public.enforce_package_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role','') = 'service_role' then
    return new;
  end if;
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.featured := false;
    if new.status not in ('draft','pending') then
      raise exception 'Agencies can only create packages as draft or pending; publishing requires admin approval'
        using errcode = '42501';
    end if;
    if new.status = 'pending' and not exists (
      select 1 from public.package_departures d
      where d.package_id = new.id
        and d.status = 'scheduled'
        and d.departure_date >= current_date
    ) then
      raise exception 'At least one upcoming departure is required before submitting for review';
    end if;
    return new;
  end if;

  -- UPDATE path: behavior unchanged from wiz8, plus the draft→pending gate.
  if new.featured is distinct from old.featured then
    raise exception 'Agencies cannot change the featured flag'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status and new.status not in ('draft','pending') then
    raise exception 'Agencies can only set status to draft or pending; publishing requires admin approval'
      using errcode = '42501';
  end if;

  if old.status = 'draft' and new.status = 'pending' and not exists (
    select 1 from public.package_departures d
    where d.package_id = new.id
      and d.status = 'scheduled'
      and d.departure_date >= current_date
  ) then
    raise exception 'At least one upcoming departure is required before submitting for review';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_package_update_guard() from public, anon, authenticated;

drop trigger if exists trg_enforce_package_update_guard on public.packages;
create trigger trg_enforce_package_update_guard
  before insert or update on public.packages
  for each row execute function public.enforce_package_update_guard();

-- Deals: same INSERT-time hole. Non-admin inserts are forced to pending review
-- regardless of what the client sends; the UPDATE path is unchanged from
-- 20260709000100 (service-role bypass + admin latitude + back-to-review on
-- material edits).

create or replace function public.guard_deal_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Backend / service-role connections (e.g. edge functions, seeds) bypass.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.has_role(auth.uid(), 'admin'::app_role) then
      new.approval_status := 'pending';
    end if;
    return new;
  end if;

  if not public.has_role(auth.uid(), 'admin'::app_role) then
    if new.approval_status is distinct from old.approval_status then
      new.approval_status := old.approval_status;
    end if;
    if (new.discount_percentage is distinct from old.discount_percentage)
       or (new.start_date is distinct from old.start_date)
       or (new.end_date is distinct from old.end_date)
       or (new.package_id is distinct from old.package_id) then
      new.approval_status := 'pending';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_deal_approval() from public, anon, authenticated;

drop trigger if exists guard_deal_approval on public.deals;
create trigger guard_deal_approval
  before insert or update on public.deals
  for each row execute function public.guard_deal_approval();
