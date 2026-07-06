-- WIZ-8: DB-level guard so agencies cannot self-feature or self-publish a
-- package via direct table UPDATEs (the save_package RPC already prevents it,
-- but ManagePackages and any other client path write to `packages` directly).
--
-- Admins and service-role/backend connections bypass. Agencies may only move a
-- package between 'draft' and 'pending' (submit for review); 'published' /
-- 'archived' / 'suspended' require an admin (owner decision: admin approval).
-- The save_package RPC only ever sets draft/pending for agencies, so it passes.

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

  if new.featured is distinct from old.featured then
    raise exception 'Agencies cannot change the featured flag'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status and new.status not in ('draft','pending') then
    raise exception 'Agencies can only set status to draft or pending; publishing requires admin approval'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_package_update_guard() from public, anon, authenticated;

drop trigger if exists trg_enforce_package_update_guard on public.packages;
create trigger trg_enforce_package_update_guard
  before update on public.packages
  for each row execute function public.enforce_package_update_guard();
