-- Performance tuning for the tables added in this change-set, per database
-- linter guidance: wrap auth.uid()/has_role() in scalar subqueries so RLS
-- evaluates them once per statement (auth_rls_initplan), and add covering
-- indexes for the new foreign keys.

-- deals
drop policy "Agencies can view their own deals" on public.deals;
create policy "Agencies can view their own deals"
  on public.deals for select to authenticated
  using ((select auth.uid()) = agency_id);

drop policy "Admins can view all deals" on public.deals;
create policy "Admins can view all deals"
  on public.deals for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin')));

drop policy "Agencies can create their own deals" on public.deals;
create policy "Agencies can create their own deals"
  on public.deals for insert to authenticated
  with check ((select auth.uid()) = agency_id);

drop policy "Agencies can update their own deals" on public.deals;
create policy "Agencies can update their own deals"
  on public.deals for update to authenticated
  using ((select auth.uid()) = agency_id)
  with check ((select auth.uid()) = agency_id);

drop policy "Agencies can delete their own deals" on public.deals;
create policy "Agencies can delete their own deals"
  on public.deals for delete to authenticated
  using ((select auth.uid()) = agency_id);

-- messages
drop policy "Participants can view their messages" on public.messages;
create policy "Participants can view their messages"
  on public.messages for select to authenticated
  using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

drop policy "Users can send messages as themselves" on public.messages;
create policy "Users can send messages as themselves"
  on public.messages for insert to authenticated
  with check ((select auth.uid()) = sender_id);

drop policy "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
  on public.messages for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

-- destinations: scope the admin policy to authenticated so anon SELECT only
-- consults the public policy (multiple_permissive_policies), and use the
-- initplan form.
drop policy "Admins can manage destinations" on public.destinations;
create policy "Admins can manage destinations"
  on public.destinations for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin')))
  with check ((select public.has_role((select auth.uid()), 'admin')));

-- platform_settings
drop policy "Admins can view platform settings" on public.platform_settings;
create policy "Admins can view platform settings"
  on public.platform_settings for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin')));

drop policy "Admins can update platform settings" on public.platform_settings;
create policy "Admins can update platform settings"
  on public.platform_settings for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin')))
  with check ((select public.has_role((select auth.uid()), 'admin')));

-- covering indexes for new foreign keys
create index if not exists idx_deals_package on public.deals (package_id);
create index if not exists idx_platform_settings_updated_by on public.platform_settings (updated_by);
