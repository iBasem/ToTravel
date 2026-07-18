-- Wave 4 guard patch (regression sweep REG-2/3/7/15/17/18/19/20 —
-- docs/audits/agency-portal-regression-2026-07-18.md).
--
-- (a) is_active_agency(): suspended/pending/rejected agencies were blocked
--     only by the client interstitial (REG-3). Every agency write guard now
--     requires active status.
-- (b) Booking guard pins departure_id (REG-2): it was the one mutable column
--     left unpinned, allowing an agency to point its own booking at ANY
--     departure — including a competitor's — and silently consume their
--     capacity via the departure_id-scoped capacity trigger.
-- (c) Deal guard: `title` joins the material-change list (REG-7 — a deal
--     rejected over its title could never be resubmitted while the UI
--     claimed it was), and approval clears rejection_reason for ALL callers
--     (REG-18 — raw-API admin approvals shipped stale reasons into the
--     deal_approved notification).
-- (d) Package guard: the upcoming-departure submit gate also covers
--     suspended->pending resubmits (REG-15). Note: INSERT with
--     status='pending' remains categorically unreachable (departures
--     FK-require the package row) — that is intentional; insert as draft,
--     then transition.
-- (e) Notification triggers gain the standard service-role skip (REG-17) so
--     seeds/backfills don't spawn notifications.
-- (f) Departure delete guard gains the admin bypass every sibling guard has
--     (REG-19).
-- (g) client_errors: attributed inserts only + length caps;
--     agency_activity_logs: agency-role holders only + length caps (REG-20).

-- (a) active-agency helper ---------------------------------------------------
create or replace function public.is_active_agency(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.travel_agencies
    where id = _user_id and status = 'active'
  )
$$;
revoke all on function public.is_active_agency(uuid) from public, anon, authenticated;

-- (b)+(a) booking guard ------------------------------------------------------
create or replace function public.enforce_booking_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  if exists (
    select 1 from public.packages p
    where p.id = new.package_id and p.agency_id = auth.uid()
  ) then
    if not public.is_active_agency(auth.uid()) then
      raise exception 'Agency account is not active' using errcode = '42501';
    end if;

    if new.total_price       is distinct from old.total_price
    or new.payment_status    is distinct from old.payment_status
    or new.payment_method    is distinct from old.payment_method
    or new.payment_reference is distinct from old.payment_reference
    or new.traveler_id       is distinct from old.traveler_id
    or new.package_id        is distinct from old.package_id
    or new.departure_id      is distinct from old.departure_id
    or new.participants      is distinct from old.participants
    or new.booking_date      is distinct from old.booking_date
    or new.special_requests  is distinct from old.special_requests then
      raise exception 'Agencies may only update booking status'
        using errcode = '42501';
    end if;

    if new.cancellation_reason is distinct from old.cancellation_reason
       and new.status <> 'cancelled' then
      raise exception 'A cancellation reason may only be set when cancelling the booking'
        using errcode = '42501';
    end if;

    if new.status is distinct from old.status then
      if not (
        (old.status = 'pending'   and new.status in ('confirmed','cancelled')) or
        (old.status = 'confirmed' and new.status = 'cancelled') or
        (old.status = 'confirmed' and new.status = 'completed' and old.payment_status = 'paid')
      ) then
        raise exception 'Invalid booking status transition: % -> % (completed requires a paid booking)', old.status, new.status
          using errcode = '42501';
      end if;
    end if;

    return new;
  end if;

  raise exception 'Not authorized to modify this booking'
    using errcode = '42501';
end;
$$;
revoke execute on function public.enforce_booking_update_guard() from anon, authenticated;

-- (c)+(a) deal guard ---------------------------------------------------------
create or replace function public.guard_deal_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.has_role(auth.uid(), 'admin'::app_role) then
      if not public.is_active_agency(auth.uid()) then
        raise exception 'Agency account is not active' using errcode = '42501';
      end if;
      new.approval_status := 'pending';
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  if not public.has_role(auth.uid(), 'admin'::app_role) then
    if not public.is_active_agency(auth.uid()) then
      raise exception 'Agency account is not active' using errcode = '42501';
    end if;
    if new.approval_status is distinct from old.approval_status then
      new.approval_status := old.approval_status;
    end if;
    if new.rejection_reason is distinct from old.rejection_reason then
      new.rejection_reason := old.rejection_reason;
    end if;
    if (new.title is distinct from old.title)
       or (new.discount_percentage is distinct from old.discount_percentage)
       or (new.start_date is distinct from old.start_date)
       or (new.end_date is distinct from old.end_date)
       or (new.package_id is distinct from old.package_id) then
      new.approval_status := 'pending';
      new.rejection_reason := null;
    end if;
  end if;

  -- Approval clears any stale reason regardless of caller (REG-18).
  if new.approval_status = 'approved' then
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_deal_approval() from public, anon, authenticated;

-- (d)+(a) package guard ------------------------------------------------------
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

  if not public.is_active_agency(auth.uid()) then
    raise exception 'Agency account is not active' using errcode = '42501';
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

  if new.featured is distinct from old.featured then
    raise exception 'Agencies cannot change the featured flag'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status and new.status not in ('draft','pending') then
    raise exception 'Agencies can only set status to draft or pending; publishing requires admin approval'
      using errcode = '42501';
  end if;

  -- Submit gate covers draft AND suspended resubmits (REG-15);
  -- published->pending (the RPC auto-demote on edit) stays exempt.
  if old.status in ('draft','suspended') and new.status = 'pending' and not exists (
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

-- (a) messages: agencies must be active to send -------------------------------
create or replace function public.enforce_agency_message_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role','') = 'service_role' then
    return new;
  end if;
  -- Only constrains senders that ARE agencies; travelers are untouched.
  if exists (select 1 from public.travel_agencies ta where ta.id = new.sender_id)
     and not public.is_active_agency(new.sender_id) then
    raise exception 'Agency account is not active' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.enforce_agency_message_guard() from public, anon, authenticated;
drop trigger if exists trg_enforce_agency_message_guard on public.messages;
create trigger trg_enforce_agency_message_guard
  before insert on public.messages
  for each row execute function public.enforce_agency_message_guard();

-- (e) notification triggers: service-role skip -------------------------------
create or replace function public.notify_deal_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role','') = 'service_role' then
    return new;
  end if;
  if new.approval_status is distinct from old.approval_status
     and new.approval_status in ('approved','rejected') then
    insert into public.notifications (user_id, type, title_key, body_params, entity_type, entity_id)
    values (
      new.agency_id,
      case when new.approval_status = 'approved' then 'deal_approved' else 'deal_rejected' end,
      case when new.approval_status = 'approved' then 'notifications.dealApproved' else 'notifications.dealRejected' end,
      jsonb_build_object('title', new.title, 'reason', coalesce(new.rejection_reason, '')),
      'deal',
      new.id
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_deal_decision() from public, anon, authenticated;

create or replace function public.notify_package_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role','') = 'service_role' then
    return new;
  end if;
  if new.status is distinct from old.status
     and new.status in ('published','suspended','archived') then
    insert into public.notifications (user_id, type, title_key, body_params, entity_type, entity_id)
    values (
      new.agency_id,
      'package_' || new.status,
      'notifications.package' || initcap(new.status),
      jsonb_build_object('title', new.title),
      'package',
      new.id
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_package_decision() from public, anon, authenticated;

-- (f) departure delete guard: admin bypass -----------------------------------
create or replace function public.enforce_departure_delete_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role','') = 'service_role' then
    return old;
  end if;
  if public.has_role(auth.uid(), 'admin') then
    return old;
  end if;
  if exists (
    select 1 from public.package_bookings b
    where b.departure_id = old.id
      and coalesce(b.status, 'pending') in ('pending', 'confirmed')
  ) then
    raise exception 'Cannot delete a departure with active bookings; cancel the departure instead'
      using errcode = '42501';
  end if;
  return old;
end;
$$;
revoke execute on function public.enforce_departure_delete_guard() from public, anon, authenticated;

-- (g) report-table hardening -------------------------------------------------
drop policy if exists "Users report their own errors" on public.client_errors;
create policy "Users report their own errors"
  on public.client_errors for insert to authenticated
  with check ((select auth.uid()) = user_id);

alter table public.client_errors
  add constraint client_errors_message_len check (char_length(message) <= 2000),
  add constraint client_errors_stack_len check (stack is null or char_length(stack) <= 8000),
  add constraint client_errors_path_len check (path is null or char_length(path) <= 500);

drop policy if exists "Agencies insert their own activity" on public.agency_activity_logs;
create policy "Agencies insert their own activity"
  on public.agency_activity_logs for insert to authenticated
  with check (
    (select auth.uid()) = agency_id
    and public.has_role((select auth.uid()), 'agency'::app_role)
  );

alter table public.agency_activity_logs
  add constraint agency_activity_action_len check (char_length(action_type) <= 100),
  add constraint agency_activity_desc_len check (char_length(action_description) <= 1000);
