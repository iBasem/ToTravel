-- Follow-up hardening: the three guard/capacity trigger functions added in this
-- batch are SECURITY DEFINER and were only REVOKE'd from anon/authenticated, but
-- functions grant EXECUTE to PUBLIC by default — so they remained callable via
-- /rest/v1/rpc/*. Trigger functions do not need direct EXECUTE (triggers fire
-- regardless of the caller's privilege), so revoke it from PUBLIC entirely.
-- (Consistent with the 20260704000000 trigger-hardening migration.)

revoke execute on function public.enforce_agency_update_guard() from public;
revoke execute on function public.enforce_booking_update_guard() from public;
revoke execute on function public.enforce_booking_capacity() from public;
