-- The admin package-inspection page (/admin/packages/:id) must show media,
-- itineraries and routes for packages in ANY status — that is the whole point
-- of moderating pending/draft/suspended packages. These child tables only had
-- owner + published-package SELECT policies, so admins saw empty tabs the
-- moment a package left 'published'. package_departures already grants
-- admins ALL; these three grant read-only inspection in the same
-- perf-tuned initplan form as the other admin policies.

drop policy if exists "Admins can view all package media" on public.package_media;
create policy "Admins can view all package media"
  on public.package_media
  for select
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::app_role)));

drop policy if exists "Admins can view all itineraries" on public.itineraries;
create policy "Admins can view all itineraries"
  on public.itineraries
  for select
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::app_role)));

drop policy if exists "Admins can view all package routes" on public.package_routes;
create policy "Admins can view all package routes"
  on public.package_routes
  for select
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::app_role)));
