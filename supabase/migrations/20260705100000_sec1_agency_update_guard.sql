-- SEC-1: Prevent agencies from self-verifying, changing their status, or
-- tampering with commission_rate / rating / total_reviews.
--
-- Root cause: the "Agencies can update their own profile" RLS policy is
-- USING-only (no WITH CHECK) and the `authenticated` role holds column-level
-- UPDATE grants on every column. Column REVOKE is unusable here because admins
-- also connect as the `authenticated` Postgres role and legitimately need to
-- change these columns. We therefore guard with a BEFORE UPDATE trigger that
-- lets admins and service-role/backend connections through, but blocks any
-- other caller (i.e. the owning agency) from changing protected columns.

create or replace function public.enforce_agency_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Backend / service-role connections (e.g. edge functions) bypass the guard.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  -- Admins may change anything.
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  -- The owning agency (or anyone else) may NOT change trust/financial columns.
  if new.is_verified   is distinct from old.is_verified
  or new.status        is distinct from old.status
  or new.commission_rate is distinct from old.commission_rate
  or new.rating        is distinct from old.rating
  or new.total_reviews is distinct from old.total_reviews then
    raise exception 'Not authorized to modify verification, status, commission, or rating fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_agency_update_guard() from anon, authenticated;

drop trigger if exists trg_enforce_agency_update_guard on public.travel_agencies;
create trigger trg_enforce_agency_update_guard
  before update on public.travel_agencies
  for each row execute function public.enforce_agency_update_guard();
