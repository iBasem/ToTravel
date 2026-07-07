-- Public reviews display their author's name and avatar, but the travelers
-- table is (correctly) not readable by anonymous visitors, so the
-- reviews -> travelers join returned null and crashed ReviewsSection once
-- real reviews existed. This view deliberately exposes ONLY the reviewer
-- display fields for travelers who have written a (public) review — nothing
-- else from the travelers row. It intentionally runs with owner rights
-- (no security_invoker) for exactly that narrow disclosure.

create view public.review_authors as
select
  r.id as review_id,
  t.first_name,
  t.last_name,
  t.avatar_url
from public.reviews r
join public.travelers t on t.id = r.traveler_id;

comment on view public.review_authors is
  'Reviewer display identity (name + avatar) for public reviews. Owner-rights on purpose: exposes only these fields, only for travelers with a public review.';

grant select on public.review_authors to anon, authenticated;
