-- Normalize travel_agencies.status to the documented lifecycle
-- (pending -> active, with rejected/suspended as moderation outcomes) and
-- finally add the CHECK constraint that data2 deferred. Legacy rows used
-- 'approved' as the post-verification status.

-- The agency-update guard trigger only lets admins/service role touch
-- status, so run this data fix as service role (same trick as the seeds).
select set_config('request.jwt.claims', '{"role":"service_role"}', false);

update public.travel_agencies
   set status = 'active'
 where status = 'approved';

update public.travel_agencies
   set status = 'pending'
 where status is null;

alter table public.travel_agencies
  alter column status set default 'pending',
  alter column status set not null;

alter table public.travel_agencies
  drop constraint if exists travel_agencies_status_check;
alter table public.travel_agencies
  add constraint travel_agencies_status_check
  check (status in ('pending', 'active', 'rejected', 'suspended'));
