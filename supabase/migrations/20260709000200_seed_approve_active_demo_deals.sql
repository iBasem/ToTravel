-- Demo seed: the platform admin has reviewed the currently-running agency
-- deals and approved them. Scheduled/expired deals stay pending so the admin
-- moderation queue still has content to demo.

select set_config('request.jwt.claims', '{"role":"service_role"}', false);

update public.deals
set approval_status = 'approved'
where status = 'active';
