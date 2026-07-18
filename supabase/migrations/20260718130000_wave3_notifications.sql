-- Wave 3 (audit: notifications architecture gap — docs/audits/agency-portal-audit-2026-07-18.md).
-- Agencies previously learned about deal approvals/rejections and package
-- status decisions only by revisiting pages. This adds a notifications table
-- written EXCLUSIVELY by SECURITY DEFINER triggers on admin decisions, read
-- by the owner over RLS + realtime.
--
-- title_key is an i18n key the client localizes; body_params carries the
-- interpolation values (e.g. the deal title, rejection reason).

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('deal_approved','deal_rejected','package_published','package_suspended','package_archived')),
  title_key text not null,
  body_params jsonb not null default '{}'::jsonb,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications (user_id, created_at desc) where read_at is null;
create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Owners may only flip read_at (guarded below); no client INSERT/DELETE.
create policy "Users can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.guard_notification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role','') = 'service_role' then
    return new;
  end if;
  if new.user_id    is distinct from old.user_id
  or new.type       is distinct from old.type
  or new.title_key  is distinct from old.title_key
  or new.body_params is distinct from old.body_params
  or new.entity_type is distinct from old.entity_type
  or new.entity_id  is distinct from old.entity_id
  or new.created_at is distinct from old.created_at then
    raise exception 'Only read_at may be updated' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_notification_update() from public, anon, authenticated;
create trigger trg_guard_notification_update
  before update on public.notifications
  for each row execute function public.guard_notification_update();

-- Deal decisions -> notify the agency.
create or replace function public.notify_deal_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
drop trigger if exists trg_notify_deal_decision on public.deals;
create trigger trg_notify_deal_decision
  after update on public.deals
  for each row execute function public.notify_deal_decision();

-- Package decisions -> notify the agency.
create or replace function public.notify_package_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
drop trigger if exists trg_notify_package_decision on public.packages;
create trigger trg_notify_package_decision
  after update on public.packages
  for each row execute function public.notify_package_decision();

alter publication supabase_realtime add table public.notifications;
