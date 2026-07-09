-- Deals: admin approval workflow + public feed of approved, active deals.
-- Agencies create deals (existing policies); admins approve; anonymous
-- visitors read only approved+active deals via the active_deals view.

-- 1) Approval state
alter table public.deals
  add column approval_status text not null default 'pending'
  check (approval_status in ('pending', 'approved', 'rejected'));

-- 2) Public visibility of approved, currently-active deals
create policy "Public can view approved active deals"
  on public.deals for select
  to anon, authenticated
  using (approval_status = 'approved' and status = 'active');

-- 3) Admins can update any deal (approve / reject / pause)
create policy "Admins can update all deals"
  on public.deals for update
  to authenticated
  using (public.has_role((select auth.uid()), 'admin'::app_role))
  with check (public.has_role((select auth.uid()), 'admin'::app_role));

-- 4) Guard: agencies can never set their own approval state, and material
--    edits to an already-reviewed deal send it back to review.
create or replace function public.guard_deal_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

create trigger guard_deal_approval
  before update on public.deals
  for each row execute function public.guard_deal_approval();

-- 5) Partial index for the public feed
create index idx_deals_active_public on public.deals (end_date)
  where approval_status = 'approved' and status = 'active';

-- 6) Public feed view. security_invoker: RLS of the querying role applies,
--    so this exposes exactly what the deals/packages policies already allow.
create or replace view public.active_deals
with (security_invoker = true)
as
select
  d.id,
  d.package_id,
  d.agency_id,
  d.title,
  d.discount_percentage,
  d.start_date,
  d.end_date,
  p.base_price as original_price,
  round(p.base_price * (1 - d.discount_percentage / 100.0), 2) as sale_price
from public.deals d
join public.packages p on p.id = d.package_id
where d.approval_status = 'approved'
  and d.status = 'active'
  and current_date between d.start_date and d.end_date
  and p.status = 'published';

grant select on public.active_deals to anon, authenticated;
