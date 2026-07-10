-- Demo admin account (fictional, same convention as the other demo logins)
-- so the admin dashboard can be demoed: admin@totravel.demo / DemoAdmin1!
-- The auth.users insert fires handle_new_user (travelers row + traveler
-- role); the extra user_roles row makes them an admin, which the profiles
-- view surfaces with admin priority.

select set_config('request.jwt.claims', '{"role":"service_role"}', false);

do $$
declare
  v_id uuid := '90000000-0000-0000-0000-000000000001';
begin
  if exists (select 1 from auth.users where email = 'admin@totravel.demo') then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    'admin@totravel.demo',
    extensions.crypt('DemoAdmin1!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Demo","last_name":"Admin"}',
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_id,
    v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', 'admin@totravel.demo', 'email_verified', true),
    'email',
    now(), now(), now()
  );

  insert into public.user_roles (user_id, role)
  values (v_id, 'admin')
  on conflict do nothing;
end $$;
