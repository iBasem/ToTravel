-- Traveler avatar storage bucket.
-- The traveler profile page uploads to avatars/{auth.uid()}/{filename} and
-- stores the public URL in travelers.avatar_url. Mirrors the agency-gallery
-- bucket conventions: image-only uploads, a 5MB cap, and owner-folder write
-- scoping (first path segment = user id).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

-- Public read: avatars render via public URLs (headers, reviews).
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Writes are restricted to the owner's folder.
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
