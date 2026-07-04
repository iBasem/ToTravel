-- Security hardening per Supabase advisors:
-- 1. Pin search_path on update_package_rating (was mutable)
create or replace function public.update_package_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pkg_id uuid;
begin
  if (TG_OP = 'DELETE') then
    pkg_id := old.package_id;
  else
    pkg_id := new.package_id;
  end if;

  update public.packages
  set
    average_rating = (select coalesce(avg(rating), 0) from public.reviews where package_id = pkg_id),
    total_reviews = (select count(*) from public.reviews where package_id = pkg_id)
  where id = pkg_id;

  return null;
end;
$$;

-- 2. Trigger functions are invoked by triggers (as owner), never by clients:
--    revoke direct REST execution from anon/authenticated.
--    (has_role stays executable: RLS policies evaluate it as the calling user.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_package_rating() from public, anon, authenticated;
