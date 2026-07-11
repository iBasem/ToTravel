-- Agency media gallery storage bucket.
-- The agency Gallery page (src/features/agency/pages/Gallery.tsx) uploads to
-- agency-gallery/{auth.uid()}/{filename} and renders public URLs, but the
-- bucket was never created in a migration. Create it with image-only uploads,
-- a 10MB cap, and owner-folder write scoping (first path segment = user id).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agency-gallery',
  'agency-gallery',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

-- Public read: gallery images are showcased via public URLs.
create policy "Anyone can view agency gallery images"
  on storage.objects for select
  using (bucket_id = 'agency-gallery');

-- Writes are restricted to the owner's folder.
create policy "Agencies can upload to their own gallery folder"
  on storage.objects for insert
  with check (
    bucket_id = 'agency-gallery'
    and auth.role() = 'authenticated'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Agencies can update their own gallery images"
  on storage.objects for update
  using (
    bucket_id = 'agency-gallery'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Agencies can delete their own gallery images"
  on storage.objects for delete
  using (
    bucket_id = 'agency-gallery'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
