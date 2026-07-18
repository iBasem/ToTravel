-- Wave 1 (audit AGY-14 + advisor lint 0025 — docs/audits/agency-portal-audit-2026-07-18.md).
--
-- Two storage hardenings, verified against every frontend call site:
--
-- 1) package-media INSERT was open to any authenticated user at ANY path.
--    All uploaders (MediaStep.tsx, StaysStep.tsx, usePackages.ts) write to
--    {auth.uid()}/... paths, so scope INSERT to the owner folder like the
--    agency-gallery / avatars buckets already do.
--
-- 2) The three public buckets each had a broad SELECT policy, letting any
--    client LIST every file (advisor: public_bucket_allows_listing). Object
--    reads on public buckets are served via public URLs and need no SELECT
--    policy; only .list() and API reads do. The only .list() caller is the
--    agency Gallery (own folder). Scope SELECT to owner folder + admins.

-- 1) package-media: owner-folder INSERT
drop policy if exists "Authenticated users can upload package media" on storage.objects;
create policy "Users can upload package media to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'package-media'
    and auth.role() = 'authenticated'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- 2) Replace broad listing SELECTs with owner + admin scope
drop policy if exists "Anyone can view package media files" on storage.objects;
create policy "Users can list their own package media"
  on storage.objects for select
  using (
    bucket_id = 'package-media'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.has_role((select auth.uid()), 'admin'::app_role)
    )
  );

drop policy if exists "Anyone can view agency gallery images" on storage.objects;
create policy "Agencies can list their own gallery images"
  on storage.objects for select
  using (
    bucket_id = 'agency-gallery'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.has_role((select auth.uid()), 'admin'::app_role)
    )
  );

drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Users can list their own avatars"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.has_role((select auth.uid()), 'admin'::app_role)
    )
  );
