-- Replace the review_authors SECURITY DEFINER view (flagged ERROR by the
-- database linter) with an equivalent SECURITY DEFINER function, matching the
-- pattern already used by has_role/save_package/agency_public_stats. Same
-- narrow disclosure: reviewer display name + avatar for public reviews only.

drop view if exists public.review_authors;

create or replace function public.review_authors(review_ids uuid[])
returns table (
  review_id uuid,
  first_name text,
  last_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, t.first_name, t.last_name, t.avatar_url
  from public.reviews r
  join public.travelers t on t.id = r.traveler_id
  where r.id = any(review_ids);
$$;

revoke all on function public.review_authors(uuid[]) from public;
grant execute on function public.review_authors(uuid[]) to anon, authenticated;
