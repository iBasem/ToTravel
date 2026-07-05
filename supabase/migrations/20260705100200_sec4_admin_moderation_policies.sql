-- SEC-4: Restore admin moderation power that was silently missing.
--
-- The app calls update on travel_agencies (verify / suspend / set commission)
-- and delete on reviews (moderation), but no RLS policy granted admins those
-- rights, so every such call matched 0 rows and returned success-shaped
-- results. These policies make admin verification and review moderation
-- actually take effect. (The SEC-1 agency guard already lets admins through.)

-- Admins can update any agency (verification, status, commission, etc.).
drop policy if exists "Admins can update all agencies" on public.travel_agencies;
create policy "Admins can update all agencies"
  on public.travel_agencies
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Admins can delete any review (moderation of abusive/fraudulent content).
drop policy if exists "Admins can delete any review" on public.reviews;
create policy "Admins can delete any review"
  on public.reviews
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Admins can update any review (e.g. unpublish / correct) for completeness.
drop policy if exists "Admins can update any review" on public.reviews;
create policy "Admins can update any review"
  on public.reviews
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
