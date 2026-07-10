-- Admin dashboard completion: messages oversight + platform stats refresh.
--
-- 1) messages had no admin RLS at all, so the admin Messages oversight page
--    could not read anything. Grant admins read (oversight) and delete
--    (moderation of abusive content), in the same perf-tuned initplan form
--    as 20260707020400_perf_tune_new_tables.sql.
-- 2) compute_platform_stats(date) lets an admin refresh the daily
--    platform_stats snapshot on demand (the table was only ever seeded).

-- ---------------------------------------------------------------------------
-- 1) Admin oversight of messages
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can view all messages" on public.messages;
create policy "Admins can view all messages"
  on public.messages
  for select
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::app_role)));

drop policy if exists "Admins can delete messages" on public.messages;
create policy "Admins can delete messages"
  on public.messages
  for delete
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ---------------------------------------------------------------------------
-- 2) Daily platform stats snapshot, refreshable by admins
-- ---------------------------------------------------------------------------

create or replace function public.compute_platform_stats(p_date date default current_date)
returns public.platform_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.platform_stats;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  insert into public.platform_stats
    (stat_date, total_bookings, total_revenue, new_travelers, new_agencies, active_packages)
  values (
    p_date,
    (select count(*) from public.package_bookings where created_at::date = p_date),
    (select coalesce(sum(total_price), 0)
       from public.package_bookings
      where created_at::date = p_date and payment_status = 'paid'),
    (select count(*) from public.travelers where created_at::date = p_date),
    (select count(*) from public.travel_agencies where created_at::date = p_date),
    (select count(*) from public.packages where status = 'published')
  )
  on conflict (stat_date) do update set
    total_bookings  = excluded.total_bookings,
    total_revenue   = excluded.total_revenue,
    new_travelers   = excluded.new_travelers,
    new_agencies    = excluded.new_agencies,
    active_packages = excluded.active_packages
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.compute_platform_stats(date) from public, anon;
grant execute on function public.compute_platform_stats(date) to authenticated;
