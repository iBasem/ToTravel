-- Align guard_deal_approval with the repo guard pattern (see
-- sec1_agency_update_guard): backend/service-role connections bypass the
-- guard so edge functions and seed migrations can manage approval state.

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
