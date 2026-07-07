-- Give the three fictional demo agencies a known demo password
-- (DemoAgency1!) so the agency dashboard can be shown in demos.
-- The real user accounts (admin / Ask Tourist) are not touched.
update auth.users
set encrypted_password = extensions.crypt('DemoAgency1!', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email in ('hello@oceanvoyages.com', 'info@desertdreams.com', 'contact@mountainescape.com');
