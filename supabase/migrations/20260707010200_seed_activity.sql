-- Seed: demo platform activity. Travelers (created through auth.users so
-- the handle_new_user trigger builds profiles and roles), bookings,
-- payments, reviews, wishlist, messages, deals, payouts, platform stats
-- and admin rows. Aggregates (payouts, platform_stats, agency ratings) are
-- computed FROM the seeded rows, never invented.
-- Runs with service_role claims so the deliberate write-guard triggers
-- recognize the sanctioned seeding path (same privilege as the edge fns).
select set_config('request.jwt.claims', '{"role":"service_role"}', false);

-- ---- demo traveler accounts (password: DemoTravel1!) ----
with t(id, email, meta, joined, nationality, phone, avatar_n, n) as (values
('a0000000-0000-4000-8000-000000000001'::uuid, 'sara.alqahtani@totravel.demo', '{"role": "traveler", "first_name": "Sara", "last_name": "Al-Qahtani"}'::jsonb, timestamptz '2024-09-14 10:00+00', 'Saudi Arabia', '+966501234561', 47, 1),
('a0000000-0000-4000-8000-000000000002'::uuid, 'mohammed.alharbi@totravel.demo', '{"role": "traveler", "first_name": "Mohammed", "last_name": "Al-Harbi"}'::jsonb, timestamptz '2024-11-02 10:00+00', 'Saudi Arabia', '+966501234562', 12, 2),
('a0000000-0000-4000-8000-000000000003'::uuid, 'layla.hassan@totravel.demo', '{"role": "traveler", "first_name": "Layla", "last_name": "Hassan"}'::jsonb, timestamptz '2025-01-21 10:00+00', 'Egypt', '+201001234563', 44, 3),
('a0000000-0000-4000-8000-000000000004'::uuid, 'omar.khalil@totravel.demo', '{"role": "traveler", "first_name": "Omar", "last_name": "Khalil"}'::jsonb, timestamptz '2025-03-08 10:00+00', 'Jordan', '+962791234564', 15, 4),
('a0000000-0000-4000-8000-000000000005'::uuid, 'emma.wilson@totravel.demo', '{"role": "traveler", "first_name": "Emma", "last_name": "Wilson"}'::jsonb, timestamptz '2025-05-17 10:00+00', 'United Kingdom', '+447701234565', 35, 5),
('a0000000-0000-4000-8000-000000000006'::uuid, 'james.carter@totravel.demo', '{"role": "traveler", "first_name": "James", "last_name": "Carter"}'::jsonb, timestamptz '2025-07-29 10:00+00', 'United States', '+15551234566', 53, 6),
('a0000000-0000-4000-8000-000000000007'::uuid, 'nora.alfahad@totravel.demo', '{"role": "traveler", "first_name": "Nora", "last_name": "Al-Fahad"}'::jsonb, timestamptz '2025-09-30 10:00+00', 'Saudi Arabia', '+966501234567', 45, 7),
('a0000000-0000-4000-8000-000000000008'::uuid, 'david.chen@totravel.demo', '{"role": "traveler", "first_name": "David", "last_name": "Chen"}'::jsonb, timestamptz '2025-12-11 10:00+00', 'Canada', '+16041234568', 60, 8),
('a0000000-0000-4000-8000-000000000009'::uuid, 'fatima.zahra@totravel.demo', '{"role": "traveler", "first_name": "Fatima", "last_name": "Zahra"}'::jsonb, timestamptz '2026-02-23 10:00+00', 'Morocco', '+212661234569', 49, 9),
('a0000000-0000-4000-8000-000000000010'::uuid, 'aisha.rahman@totravel.demo', '{"role": "traveler", "first_name": "Aisha", "last_name": "Rahman"}'::jsonb, timestamptz '2026-05-05 10:00+00', 'United Arab Emirates', '+971501234570', 31, 10)
),
ins_users as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  select '00000000-0000-0000-0000-000000000000', t.id, 'authenticated', 'authenticated', t.email, extensions.crypt('DemoTravel1!', extensions.gen_salt('bf')), t.joined, '{"provider":"email","providers":["email"]}', t.meta, t.joined, now(), '', '', '', ''
  from t where not exists (select 1 from auth.users u where u.id = t.id)
  returning id
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), t.id, t.id::text, jsonb_build_object('sub', t.id::text, 'email', t.email, 'email_verified', true), 'email', now(), t.joined, now()
from t where not exists (select 1 from auth.identities i where i.user_id = t.id and i.provider = 'email');

-- Enrich the trigger-created traveler profiles
update public.travelers tr set
  nationality = v.nationality, phone = v.phone, avatar_url = v.avatar, date_of_birth = v.dob, status = 'active', created_at = v.joined,
  preferences = jsonb_build_object('notifications', jsonb_build_object('emailBookings', true, 'emailPromotions', v.promo, 'smsReminders', true, 'pushNotifications', true), 'privacy', jsonb_build_object('profileVisible', true, 'showTravelHistory', false, 'allowMessages', true))
from (values
('a0000000-0000-4000-8000-000000000001'::uuid, 'Saudi Arabia', '+966501234561', 'https://i.pravatar.cc/150?img=47', date '1986-02-15', timestamptz '2024-09-14 10:00+00', false),
('a0000000-0000-4000-8000-000000000002'::uuid, 'Saudi Arabia', '+966501234562', 'https://i.pravatar.cc/150?img=12', date '1987-03-15', timestamptz '2024-11-02 10:00+00', true),
('a0000000-0000-4000-8000-000000000003'::uuid, 'Egypt', '+201001234563', 'https://i.pravatar.cc/150?img=44', date '1988-04-15', timestamptz '2025-01-21 10:00+00', false),
('a0000000-0000-4000-8000-000000000004'::uuid, 'Jordan', '+962791234564', 'https://i.pravatar.cc/150?img=15', date '1989-05-15', timestamptz '2025-03-08 10:00+00', true),
('a0000000-0000-4000-8000-000000000005'::uuid, 'United Kingdom', '+447701234565', 'https://i.pravatar.cc/150?img=35', date '1990-06-15', timestamptz '2025-05-17 10:00+00', false),
('a0000000-0000-4000-8000-000000000006'::uuid, 'United States', '+15551234566', 'https://i.pravatar.cc/150?img=53', date '1991-07-15', timestamptz '2025-07-29 10:00+00', true),
('a0000000-0000-4000-8000-000000000007'::uuid, 'Saudi Arabia', '+966501234567', 'https://i.pravatar.cc/150?img=45', date '1992-08-15', timestamptz '2025-09-30 10:00+00', false),
('a0000000-0000-4000-8000-000000000008'::uuid, 'Canada', '+16041234568', 'https://i.pravatar.cc/150?img=60', date '1993-09-15', timestamptz '2025-12-11 10:00+00', true),
('a0000000-0000-4000-8000-000000000009'::uuid, 'Morocco', '+212661234569', 'https://i.pravatar.cc/150?img=49', date '1994-01-15', timestamptz '2026-02-23 10:00+00', false),
('a0000000-0000-4000-8000-000000000010'::uuid, 'United Arab Emirates', '+971501234570', 'https://i.pravatar.cc/150?img=31', date '1995-02-15', timestamptz '2026-05-05 10:00+00', true)
) v(id, nationality, phone, avatar, dob, joined, promo)
where tr.id = v.id;

-- Fill in the original owner traveler profile (was blank)
update public.travelers set first_name = 'Basem', last_name = 'Alsaadi', status = 'active' where id = '64160960-eea9-429f-9dfe-2a5ec0854725' and first_name = '';

-- ---- agency enrichment: approve verified agencies, backdate founding ----
update public.travel_agencies set status = 'approved', created_at = timestamptz '2019-03-12 09:00+00', company_description = coalesce(company_description, 'Boutique Mediterranean and Asian sea-and-city journeys with hand-picked hotels and small groups.'), website = coalesce(website, 'https://oceanvoyages.example.com'), phone = coalesce(phone, '+96650000' || substr(id::text, 1, 4)), license_number = coalesce(license_number, 'TA-' || upper(substr(id::text, 1, 6))) where id = 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e';
update public.travel_agencies set status = 'approved', created_at = timestamptz '2020-06-25 09:00+00', company_description = coalesce(company_description, 'Specialists in Middle Eastern, North African and Asian cultural travel, from desert camps to imperial cities.'), website = coalesce(website, 'https://desertdreams.example.com'), phone = coalesce(phone, '+96650000' || substr(id::text, 1, 4)), license_number = coalesce(license_number, 'TA-' || upper(substr(id::text, 1, 6))) where id = '94edd52e-2ec5-4337-8562-1f498814dc43';
update public.travel_agencies set status = 'approved', created_at = timestamptz '2021-01-18 09:00+00', company_description = coalesce(company_description, 'Adventure and nature expeditions across the Americas and Asia led by certified mountain guides.'), website = coalesce(website, 'https://mountainescape.example.com'), phone = coalesce(phone, '+96650000' || substr(id::text, 1, 4)), license_number = coalesce(license_number, 'TA-' || upper(substr(id::text, 1, 6))) where id = '4260abb8-44d7-4620-8e65-5a1ffe588550';

-- ---- bookings: 11 months of history + current-month activity ----
insert into public.package_bookings (id, package_id, traveler_id, booking_date, participants, total_price, status, payment_status, payment_method, created_at)
select v.id, p.id, v.tid, v.bdate, v.pax, v.pax * p.base_price, v.status, v.pay, 'moyasar', v.bdate - (v.created_off || ' days')::interval
from (values
('b0000000-0000-4000-8000-000000000001'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2025-08-09', 2, 'completed', 'paid', 16),
('b0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2025-08-16', 3, 'completed', 'paid', 17),
('b0000000-0000-4000-8000-000000000003'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2025-08-23', 4, 'completed', 'paid', 18),
('b0000000-0000-4000-8000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2025-08-06', 1, 'completed', 'paid', 19),
('b0000000-0000-4000-8000-000000000005'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2025-09-13', 2, 'completed', 'paid', 20),
('b0000000-0000-4000-8000-000000000006'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2025-09-20', 3, 'completed', 'paid', 21),
('b0000000-0000-4000-8000-000000000007'::uuid, 'd0000000-0000-4000-8000-000000000012'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2025-09-03', 4, 'completed', 'paid', 22),
('b0000000-0000-4000-8000-000000000008'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2025-09-10', 1, 'completed', 'paid', 23),
('b0000000-0000-4000-8000-000000000009'::uuid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2025-10-17', 2, 'cancelled', 'refunded', 24),
('b0000000-0000-4000-8000-000000000010'::uuid, 'd0000000-0000-4000-8000-000000000007'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2025-10-24', 3, 'completed', 'paid', 25),
('b0000000-0000-4000-8000-000000000011'::uuid, 'd0000000-0000-4000-8000-000000000014'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2025-10-07', 4, 'completed', 'paid', 26),
('b0000000-0000-4000-8000-000000000012'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2025-10-14', 1, 'completed', 'paid', 27),
('b0000000-0000-4000-8000-000000000013'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2025-10-21', 2, 'completed', 'paid', 28),
('b0000000-0000-4000-8000-000000000014'::uuid, 'd0000000-0000-4000-8000-000000000009'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2025-11-04', 3, 'completed', 'paid', 29),
('b0000000-0000-4000-8000-000000000015'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2025-11-11', 4, 'completed', 'paid', 30),
('b0000000-0000-4000-8000-000000000016'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2025-11-18', 1, 'completed', 'paid', 31),
('b0000000-0000-4000-8000-000000000017'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2025-11-25', 2, 'completed', 'paid', 32),
('b0000000-0000-4000-8000-000000000018'::uuid, 'd0000000-0000-4000-8000-000000000011'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2025-11-08', 3, 'cancelled', 'refunded', 33),
('b0000000-0000-4000-8000-000000000019'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2025-11-15', 4, 'completed', 'paid', 34),
('b0000000-0000-4000-8000-000000000020'::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2025-12-22', 1, 'completed', 'paid', 35),
('b0000000-0000-4000-8000-000000000021'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2025-12-05', 2, 'completed', 'paid', 36),
('b0000000-0000-4000-8000-000000000022'::uuid, 'd0000000-0000-4000-8000-000000000013'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2025-12-12', 3, 'completed', 'paid', 37),
('b0000000-0000-4000-8000-000000000023'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2025-12-19', 4, 'completed', 'paid', 38),
('b0000000-0000-4000-8000-000000000024'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2025-12-02', 1, 'completed', 'paid', 39),
('b0000000-0000-4000-8000-000000000025'::uuid, 'd0000000-0000-4000-8000-000000000008'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2025-12-09', 2, 'completed', 'paid', 40),
('b0000000-0000-4000-8000-000000000026'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2026-01-16', 3, 'completed', 'paid', 41),
('b0000000-0000-4000-8000-000000000027'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2026-01-23', 4, 'cancelled', 'refunded', 42),
('b0000000-0000-4000-8000-000000000028'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2026-01-06', 1, 'completed', 'paid', 43),
('b0000000-0000-4000-8000-000000000029'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2026-01-13', 2, 'completed', 'paid', 44),
('b0000000-0000-4000-8000-000000000030'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2026-01-20', 3, 'completed', 'paid', 15),
('b0000000-0000-4000-8000-000000000031'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2026-01-03', 4, 'completed', 'paid', 16),
('b0000000-0000-4000-8000-000000000032'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2026-01-10', 1, 'completed', 'paid', 17),
('b0000000-0000-4000-8000-000000000033'::uuid, 'd0000000-0000-4000-8000-000000000012'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2026-02-17', 2, 'completed', 'paid', 18),
('b0000000-0000-4000-8000-000000000034'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2026-02-24', 3, 'completed', 'paid', 19),
('b0000000-0000-4000-8000-000000000035'::uuid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2026-02-07', 4, 'completed', 'paid', 20),
('b0000000-0000-4000-8000-000000000036'::uuid, 'd0000000-0000-4000-8000-000000000007'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2026-02-14', 1, 'cancelled', 'refunded', 21),
('b0000000-0000-4000-8000-000000000037'::uuid, 'd0000000-0000-4000-8000-000000000014'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2026-02-21', 2, 'completed', 'paid', 22),
('b0000000-0000-4000-8000-000000000038'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2026-02-04', 3, 'completed', 'paid', 23),
('b0000000-0000-4000-8000-000000000039'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2026-02-11', 4, 'completed', 'paid', 24),
('b0000000-0000-4000-8000-000000000040'::uuid, 'd0000000-0000-4000-8000-000000000009'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2026-02-18', 1, 'completed', 'paid', 25),
('b0000000-0000-4000-8000-000000000041'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2026-03-25', 2, 'completed', 'paid', 26),
('b0000000-0000-4000-8000-000000000042'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2026-03-08', 3, 'completed', 'paid', 27),
('b0000000-0000-4000-8000-000000000043'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2026-03-15', 4, 'completed', 'paid', 28),
('b0000000-0000-4000-8000-000000000044'::uuid, 'd0000000-0000-4000-8000-000000000011'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2026-03-22', 1, 'completed', 'paid', 29),
('b0000000-0000-4000-8000-000000000045'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2026-03-05', 2, 'cancelled', 'refunded', 30),
('b0000000-0000-4000-8000-000000000046'::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2026-03-12', 3, 'completed', 'paid', 31),
('b0000000-0000-4000-8000-000000000047'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2026-03-19', 4, 'completed', 'paid', 32),
('b0000000-0000-4000-8000-000000000048'::uuid, 'd0000000-0000-4000-8000-000000000013'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2026-03-02', 1, 'completed', 'paid', 33),
('b0000000-0000-4000-8000-000000000049'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2026-04-09', 2, 'completed', 'paid', 34),
('b0000000-0000-4000-8000-000000000050'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2026-04-16', 3, 'completed', 'paid', 35),
('b0000000-0000-4000-8000-000000000051'::uuid, 'd0000000-0000-4000-8000-000000000008'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2026-04-23', 4, 'completed', 'paid', 36),
('b0000000-0000-4000-8000-000000000052'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2026-04-06', 1, 'completed', 'paid', 37),
('b0000000-0000-4000-8000-000000000053'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2026-04-13', 2, 'completed', 'paid', 38),
('b0000000-0000-4000-8000-000000000054'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2026-04-20', 3, 'cancelled', 'refunded', 39),
('b0000000-0000-4000-8000-000000000055'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2026-04-03', 4, 'completed', 'paid', 40),
('b0000000-0000-4000-8000-000000000056'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2026-04-10', 1, 'completed', 'paid', 41),
('b0000000-0000-4000-8000-000000000057'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2026-04-17', 2, 'completed', 'paid', 42),
('b0000000-0000-4000-8000-000000000058'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2026-05-24', 3, 'completed', 'paid', 43),
('b0000000-0000-4000-8000-000000000059'::uuid, 'd0000000-0000-4000-8000-000000000012'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2026-05-07', 4, 'completed', 'paid', 44),
('b0000000-0000-4000-8000-000000000060'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2026-05-14', 1, 'completed', 'paid', 15),
('b0000000-0000-4000-8000-000000000061'::uuid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2026-05-21', 2, 'completed', 'paid', 16),
('b0000000-0000-4000-8000-000000000062'::uuid, 'd0000000-0000-4000-8000-000000000007'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2026-05-04', 3, 'completed', 'paid', 17),
('b0000000-0000-4000-8000-000000000063'::uuid, 'd0000000-0000-4000-8000-000000000014'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2026-05-11', 4, 'cancelled', 'refunded', 18),
('b0000000-0000-4000-8000-000000000064'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2026-05-18', 1, 'completed', 'paid', 19),
('b0000000-0000-4000-8000-000000000065'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2026-05-25', 2, 'completed', 'paid', 20),
('b0000000-0000-4000-8000-000000000066'::uuid, 'd0000000-0000-4000-8000-000000000009'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2026-05-08', 3, 'completed', 'paid', 21),
('b0000000-0000-4000-8000-000000000067'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2026-05-15', 4, 'completed', 'paid', 22),
('b0000000-0000-4000-8000-000000000068'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2026-06-22', 1, 'completed', 'paid', 23),
('b0000000-0000-4000-8000-000000000069'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2026-06-05', 2, 'completed', 'paid', 24),
('b0000000-0000-4000-8000-000000000070'::uuid, 'd0000000-0000-4000-8000-000000000011'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2026-06-12', 3, 'completed', 'paid', 25),
('b0000000-0000-4000-8000-000000000071'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2026-06-19', 4, 'completed', 'paid', 26),
('b0000000-0000-4000-8000-000000000072'::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2026-06-02', 1, 'cancelled', 'refunded', 27),
('b0000000-0000-4000-8000-000000000073'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2026-06-09', 2, 'completed', 'paid', 28),
('b0000000-0000-4000-8000-000000000074'::uuid, 'd0000000-0000-4000-8000-000000000013'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, date '2026-06-16', 3, 'completed', 'paid', 29),
('b0000000-0000-4000-8000-000000000075'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, date '2026-06-23', 4, 'completed', 'paid', 30),
('b0000000-0000-4000-8000-000000000076'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, date '2026-06-06', 1, 'completed', 'paid', 31),
('b0000000-0000-4000-8000-000000000077'::uuid, 'd0000000-0000-4000-8000-000000000008'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, date '2026-06-13', 2, 'completed', 'paid', 32),
('b0000000-0000-4000-8000-000000000078'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, date '2026-07-10', 1, 'pending', 'pending', 1),
('b0000000-0000-4000-8000-000000000079'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, date '2026-07-13', 2, 'pending', 'pending', 2),
('b0000000-0000-4000-8000-000000000080'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, date '2026-07-16', 3, 'pending', 'pending', 3),
('b0000000-0000-4000-8000-000000000081'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, date '2026-07-19', 1, 'confirmed', 'paid', 4),
('b0000000-0000-4000-8000-000000000082'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, date '2026-07-22', 2, 'confirmed', 'paid', 5),
('b0000000-0000-4000-8000-000000000083'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, date '2026-07-25', 3, 'confirmed', 'paid', 6)
) v(id, pkg, tid, bdate, pax, status, pay, created_off)
join public.packages p on p.id = v.pkg
where not exists (select 1 from public.package_bookings b where b.id = v.id);

-- Future bookings tied to actual scheduled departures (server-authoritative price)
insert into public.package_bookings (id, package_id, traveler_id, booking_date, departure_id, participants, total_price, status, payment_status, payment_method, created_at)
select v.id, p.id, v.tid, d.departure_date, d.id, v.pax, v.pax * coalesce(d.price_override, p.base_price), 'confirmed', 'paid', 'moyasar', now() - (v.days_ago || ' days')::interval
from (values
('b0000000-0000-4000-8000-000000000084'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 0, 2, 2),
('b0000000-0000-4000-8000-000000000085'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 1, 3, 3),
('b0000000-0000-4000-8000-000000000086'::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, 2, 4, 4),
('b0000000-0000-4000-8000-000000000087'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, 3, 2, 5),
('b0000000-0000-4000-8000-000000000088'::uuid, 'd0000000-0000-4000-8000-000000000009'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 0, 3, 6),
('b0000000-0000-4000-8000-000000000089'::uuid, 'd0000000-0000-4000-8000-000000000014'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, 1, 4, 7),
('b0000000-0000-4000-8000-000000000090'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, 2, 2, 8),
('b0000000-0000-4000-8000-000000000091'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, 3, 3, 9),
('b0000000-0000-4000-8000-000000000092'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, 0, 4, 10),
('b0000000-0000-4000-8000-000000000093'::uuid, 'd0000000-0000-4000-8000-000000000008'::uuid, 'a0000000-0000-4000-8000-000000000010'::uuid, 1, 2, 11),
('b0000000-0000-4000-8000-000000000094'::uuid, 'd0000000-0000-4000-8000-000000000013'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 2, 3, 12),
('b0000000-0000-4000-8000-000000000095'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 3, 4, 13)
) v(id, pkg, tid, dep_offset, pax, days_ago)
join public.packages p on p.id = v.pkg
join lateral (select id, departure_date, price_override from public.package_departures pd where pd.package_id = p.id and pd.status = 'scheduled' and pd.departure_date > current_date + 7 order by pd.departure_date limit 1 offset v.dep_offset) d on true
where not exists (select 1 from public.package_bookings b where b.id = v.id);

-- ---- payments: one row per seeded booking, mirroring its payment state ----
insert into public.payments (booking_id, provider, provider_invoice_id, provider_payment_id, amount, currency, status, created_at)
select b.id, 'moyasar', 'inv_demo_' || substr(b.id::text, 25, 8), 'pay_demo_' || substr(b.id::text, 25, 8), b.total_price, 'SAR',
  case b.payment_status when 'paid' then 'paid' when 'refunded' then 'refunded' when 'failed' then 'failed' else 'initiated' end,
  b.created_at + interval '45 minutes'
from public.package_bookings b
where b.id::text like 'b0000000-%'
and not exists (select 1 from public.payments pay where pay.booking_id = b.id);

-- ---- reviews on completed bookings (trigger maintains package ratings) ----
insert into public.reviews (id, traveler_id, package_id, booking_id, rating, comment, created_at)
select v.id, v.tid, v.pkg, v.bid, v.rating, v.comment, v.created from (values
('e0000000-0000-4000-8000-000000000001'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 'b0000000-0000-4000-8000-000000000001'::uuid, 5, 'Well organized from airport pickup to the last day. Hotels were exactly as described.', date '2025-08-09' + interval '6 days'),
('e0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'b0000000-0000-4000-8000-000000000002'::uuid, 4, 'قيمة ممتازة مقابل السعر. التجربة فاقت توقعاتنا بمراحل.', date '2025-08-16' + interval '6 days'),
('e0000000-0000-4000-8000-000000000004'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'b0000000-0000-4000-8000-000000000004'::uuid, 4, 'الوكالة كانت متعاونة جداً وسريعة الرد على استفساراتنا. خمس نجوم عن جدارة.', date '2025-08-06' + interval '6 days'),
('e0000000-0000-4000-8000-000000000005'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'b0000000-0000-4000-8000-000000000005'::uuid, 4, 'Beautiful scenery and a friendly small group. A couple of long bus days, but worth it.', date '2025-09-13' + interval '6 days'),
('e0000000-0000-4000-8000-000000000007'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, 'd0000000-0000-4000-8000-000000000012'::uuid, 'b0000000-0000-4000-8000-000000000007'::uuid, 3, 'A trip of a lifetime — the sunrise on the final day left everyone speechless.', date '2025-09-03' + interval '6 days'),
('e0000000-0000-4000-8000-000000000008'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'b0000000-0000-4000-8000-000000000008'::uuid, 5, 'Good tour overall. The optional activities were the highlight for us.', date '2025-09-10' + interval '6 days'),
('e0000000-0000-4000-8000-000000000010'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000014'::uuid, 'b0000000-0000-4000-8000-000000000011'::uuid, 5, 'قيمة ممتازة مقابل السعر. التجربة فاقت توقعاتنا بمراحل.', date '2025-10-07' + interval '6 days'),
('e0000000-0000-4000-8000-000000000011'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 'b0000000-0000-4000-8000-000000000012'::uuid, 5, 'Well organized from airport pickup to the last day. Hotels were exactly as described.', date '2025-10-14' + interval '6 days'),
('e0000000-0000-4000-8000-000000000013'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, 'd0000000-0000-4000-8000-000000000009'::uuid, 'b0000000-0000-4000-8000-000000000014'::uuid, 5, 'The itinerary balanced famous sights with quiet local moments. Would book again.', date '2025-11-04' + interval '6 days'),
('e0000000-0000-4000-8000-000000000014'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'b0000000-0000-4000-8000-000000000015'::uuid, 4, 'Our guide went above and beyond when our flight was delayed. Five stars.', date '2025-11-11' + interval '6 days'),
('e0000000-0000-4000-8000-000000000016'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'b0000000-0000-4000-8000-000000000017'::uuid, 5, 'رحلة لا تُنسى بكل المقاييس. المرشد كان ملمّاً بكل التفاصيل والتنظيم كان رائعاً.', date '2025-11-25' + interval '6 days'),
('e0000000-0000-4000-8000-000000000017'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b0000000-0000-4000-8000-000000000019'::uuid, 3, 'A trip of a lifetime — the sunrise on the final day left everyone speechless.', date '2025-11-15' + interval '6 days'),
('e0000000-0000-4000-8000-000000000019'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'b0000000-0000-4000-8000-000000000021'::uuid, 4, 'Smooth booking, responsive agency, and a genuinely knowledgeable local team.', date '2025-12-05' + interval '6 days'),
('e0000000-0000-4000-8000-000000000020'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000013'::uuid, 'b0000000-0000-4000-8000-000000000022'::uuid, 5, 'الوكالة كانت متعاونة جداً وسريعة الرد على استفساراتنا. خمس نجوم عن جدارة.', date '2025-12-12' + interval '6 days'),
('e0000000-0000-4000-8000-000000000022'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'b0000000-0000-4000-8000-000000000024'::uuid, 4, 'كل شيء كان في موعده والإقامة كانت أفضل مما توقعنا.', date '2025-12-02' + interval '6 days'),
('e0000000-0000-4000-8000-000000000023'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'd0000000-0000-4000-8000-000000000008'::uuid, 'b0000000-0000-4000-8000-000000000025'::uuid, 5, 'The itinerary balanced famous sights with quiet local moments. Would book again.', date '2025-12-09' + interval '6 days'),
('e0000000-0000-4000-8000-000000000025'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'b0000000-0000-4000-8000-000000000028'::uuid, 4, 'Beautiful scenery and a friendly small group. A couple of long bus days, but worth it.', date '2026-01-06' + interval '6 days'),
('e0000000-0000-4000-8000-000000000026'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 'b0000000-0000-4000-8000-000000000029'::uuid, 5, 'قيمة ممتازة مقابل السعر. التجربة فاقت توقعاتنا بمراحل.', date '2026-01-13' + interval '6 days'),
('e0000000-0000-4000-8000-000000000028'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'b0000000-0000-4000-8000-000000000031'::uuid, 5, 'الوكالة كانت متعاونة جداً وسريعة الرد على استفساراتنا. خمس نجوم عن جدارة.', date '2026-01-03' + interval '6 days'),
('e0000000-0000-4000-8000-000000000029'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 'b0000000-0000-4000-8000-000000000032'::uuid, 4, 'Smooth booking, responsive agency, and a genuinely knowledgeable local team.', date '2026-01-10' + interval '6 days'),
('e0000000-0000-4000-8000-000000000031'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'b0000000-0000-4000-8000-000000000034'::uuid, 5, 'Well organized from airport pickup to the last day. Hotels were exactly as described.', date '2026-02-24' + interval '6 days'),
('e0000000-0000-4000-8000-000000000032'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'b0000000-0000-4000-8000-000000000035'::uuid, 4, 'Great value for the price. Food recommendations alone were worth it.', date '2026-02-07' + interval '6 days'),
('e0000000-0000-4000-8000-000000000034'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 'b0000000-0000-4000-8000-000000000038'::uuid, 4, 'Our guide went above and beyond when our flight was delayed. Five stars.', date '2026-02-04' + interval '6 days'),
('e0000000-0000-4000-8000-000000000035'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'b0000000-0000-4000-8000-000000000039'::uuid, 4, 'Beautiful scenery and a friendly small group. A couple of long bus days, but worth it.', date '2026-02-11' + interval '6 days'),
('e0000000-0000-4000-8000-000000000037'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'b0000000-0000-4000-8000-000000000041'::uuid, 3, 'A trip of a lifetime — the sunrise on the final day left everyone speechless.', date '2026-03-25' + interval '6 days'),
('e0000000-0000-4000-8000-000000000038'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 'b0000000-0000-4000-8000-000000000042'::uuid, 5, 'كل شيء كان في موعده والإقامة كانت أفضل مما توقعنا.', date '2026-03-08' + interval '6 days'),
('e0000000-0000-4000-8000-000000000040'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, 'd0000000-0000-4000-8000-000000000011'::uuid, 'b0000000-0000-4000-8000-000000000044'::uuid, 5, 'رحلة لا تُنسى بكل المقاييس. المرشد كان ملمّاً بكل التفاصيل والتنظيم كان رائعاً.', date '2026-03-22' + interval '6 days'),
('e0000000-0000-4000-8000-000000000041'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'b0000000-0000-4000-8000-000000000046'::uuid, 5, 'Well organized from airport pickup to the last day. Hotels were exactly as described.', date '2026-03-12' + interval '6 days'),
('e0000000-0000-4000-8000-000000000043'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, 'd0000000-0000-4000-8000-000000000013'::uuid, 'b0000000-0000-4000-8000-000000000048'::uuid, 5, 'The itinerary balanced famous sights with quiet local moments. Would book again.', date '2026-03-02' + interval '6 days'),
('e0000000-0000-4000-8000-000000000044'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'b0000000-0000-4000-8000-000000000049'::uuid, 4, 'الوكالة كانت متعاونة جداً وسريعة الرد على استفساراتنا. خمس نجوم عن جدارة.', date '2026-04-09' + interval '6 days'),
('e0000000-0000-4000-8000-000000000046'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000008'::uuid, 'b0000000-0000-4000-8000-000000000051'::uuid, 5, 'كل شيء كان في موعده والإقامة كانت أفضل مما توقعنا.', date '2026-04-23' + interval '6 days'),
('e0000000-0000-4000-8000-000000000047'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'b0000000-0000-4000-8000-000000000052'::uuid, 3, 'A trip of a lifetime — the sunrise on the final day left everyone speechless.', date '2026-04-06' + interval '6 days'),
('e0000000-0000-4000-8000-000000000049'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 'b0000000-0000-4000-8000-000000000055'::uuid, 4, 'Smooth booking, responsive agency, and a genuinely knowledgeable local team.', date '2026-04-03' + interval '6 days'),
('e0000000-0000-4000-8000-000000000050'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'b0000000-0000-4000-8000-000000000056'::uuid, 5, 'Absolutely unforgettable trip. The guide knew every hidden corner and the pacing was perfect.', date '2026-04-10' + interval '6 days'),
('e0000000-0000-4000-8000-000000000052'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 'b0000000-0000-4000-8000-000000000058'::uuid, 4, 'Great value for the price. Food recommendations alone were worth it.', date '2026-05-24' + interval '6 days'),
('e0000000-0000-4000-8000-000000000053'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, 'd0000000-0000-4000-8000-000000000012'::uuid, 'b0000000-0000-4000-8000-000000000059'::uuid, 5, 'The itinerary balanced famous sights with quiet local moments. Would book again.', date '2026-05-07' + interval '6 days'),
('e0000000-0000-4000-8000-000000000055'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'b0000000-0000-4000-8000-000000000061'::uuid, 4, 'Beautiful scenery and a friendly small group. A couple of long bus days, but worth it.', date '2026-05-21' + interval '6 days'),
('e0000000-0000-4000-8000-000000000056'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000007'::uuid, 'b0000000-0000-4000-8000-000000000062'::uuid, 5, 'رحلة لا تُنسى بكل المقاييس. المرشد كان ملمّاً بكل التفاصيل والتنظيم كان رائعاً.', date '2026-05-04' + interval '6 days'),
('e0000000-0000-4000-8000-000000000058'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'b0000000-0000-4000-8000-000000000065'::uuid, 5, 'Good tour overall. The optional activities were the highlight for us.', date '2026-05-25' + interval '6 days'),
('e0000000-0000-4000-8000-000000000059'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, 'd0000000-0000-4000-8000-000000000009'::uuid, 'b0000000-0000-4000-8000-000000000066'::uuid, 4, 'Smooth booking, responsive agency, and a genuinely knowledgeable local team.', date '2026-05-08' + interval '6 days'),
('e0000000-0000-4000-8000-000000000061'::uuid, 'a0000000-0000-4000-8000-000000000008'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 'b0000000-0000-4000-8000-000000000068'::uuid, 5, 'Well organized from airport pickup to the last day. Hotels were exactly as described.', date '2026-06-22' + interval '6 days'),
('e0000000-0000-4000-8000-000000000062'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'b0000000-0000-4000-8000-000000000069'::uuid, 4, 'كل شيء كان في موعده والإقامة كانت أفضل مما توقعنا.', date '2026-06-05' + interval '6 days'),
('e0000000-0000-4000-8000-000000000064'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b0000000-0000-4000-8000-000000000071'::uuid, 4, 'رحلة لا تُنسى بكل المقاييس. المرشد كان ملمّاً بكل التفاصيل والتنظيم كان رائعاً.', date '2026-06-19' + interval '6 days'),
('e0000000-0000-4000-8000-000000000065'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'b0000000-0000-4000-8000-000000000073'::uuid, 4, 'Beautiful scenery and a friendly small group. A couple of long bus days, but worth it.', date '2026-06-09' + interval '6 days'),
('e0000000-0000-4000-8000-000000000067'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'b0000000-0000-4000-8000-000000000075'::uuid, 3, 'A trip of a lifetime — the sunrise on the final day left everyone speechless.', date '2026-06-23' + interval '6 days'),
('e0000000-0000-4000-8000-000000000068'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'b0000000-0000-4000-8000-000000000076'::uuid, 5, 'Good tour overall. The optional activities were the highlight for us.', date '2026-06-06' + interval '6 days')
) v(id, tid, pkg, bid, rating, comment, created)
where exists (select 1 from public.package_bookings b where b.id = v.bid)
and not exists (select 1 from public.reviews r where r.booking_id = v.bid);

-- ---- wishlist ----
insert into public.wishlist (traveler_id, package_id, created_at)
select v.tid, v.pkg, now() - (v.days_ago || ' days')::interval from (values
('a0000000-0000-4000-8000-000000000001'::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 11),
('a0000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000007'::uuid, 11),
('a0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 22),
('a0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000012'::uuid, 22),
('a0000000-0000-4000-8000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 33),
('a0000000-0000-4000-8000-000000000003'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 33),
('a0000000-0000-4000-8000-000000000003'::uuid, 'd0000000-0000-4000-8000-000000000009'::uuid, 33),
('a0000000-0000-4000-8000-000000000004'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 44),
('a0000000-0000-4000-8000-000000000004'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 44),
('a0000000-0000-4000-8000-000000000004'::uuid, 'd0000000-0000-4000-8000-000000000014'::uuid, 44),
('a0000000-0000-4000-8000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 55),
('a0000000-0000-4000-8000-000000000005'::uuid, 'd0000000-0000-4000-8000-000000000011'::uuid, 55),
('a0000000-0000-4000-8000-000000000006'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 6),
('a0000000-0000-4000-8000-000000000006'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 6),
('a0000000-0000-4000-8000-000000000007'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 17),
('a0000000-0000-4000-8000-000000000007'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 17),
('a0000000-0000-4000-8000-000000000007'::uuid, 'd0000000-0000-4000-8000-000000000013'::uuid, 17),
('a0000000-0000-4000-8000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 28),
('a0000000-0000-4000-8000-000000000008'::uuid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 28),
('a0000000-0000-4000-8000-000000000009'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 39),
('a0000000-0000-4000-8000-000000000009'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 39),
('a0000000-0000-4000-8000-000000000010'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 50),
('a0000000-0000-4000-8000-000000000010'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 50),
('a0000000-0000-4000-8000-000000000010'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 50)
) v(tid, pkg, days_ago)
where not exists (select 1 from public.wishlist wl where wl.traveler_id = v.tid and wl.package_id = v.pkg);

-- ---- traveler <-> agency conversations ----
insert into public.messages (id, sender_id, recipient_id, content, created_at, read_at)
select v.id, v.s, v.r, v.content, v.created, v.read from (values
('c0000000-0000-4000-8000-000000000001'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'Is this tour suitable for children aged 8 and 10?', now() - interval '480 hours', now() - interval '478 hours'),
('c0000000-0000-4000-8000-000000000002'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'Yes, absolutely — we regularly host families and can arrange connecting rooms. The walking days are moderate.', now() - interval '477 hours', now() - interval '475 hours'),
('c0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'Great, thank you! We will book for the October departure.', now() - interval '460 hours', now() - interval '458 hours'),
('c0000000-0000-4000-8000-000000000004'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'Wonderful! Feel free to add any dietary notes in the special requests.', now() - interval '454 hours', now() - interval '452 hours'),
('c0000000-0000-4000-8000-000000000005'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'هل تشمل الرحلة تأشيرة الدخول؟', now() - interval '408 hours', now() - interval '406 hours'),
('c0000000-0000-4000-8000-000000000006'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, 'أهلاً بك! التأشيرة غير مشمولة، لكننا نرسل لك خطاب دعوة وجميع المستندات المطلوبة للتقديم.', now() - interval '405 hours', now() - interval '403 hours'),
('c0000000-0000-4000-8000-000000000007'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'ممتاز، شكراً جزيلاً لكم.', now() - interval '388 hours', null::timestamptz),
('c0000000-0000-4000-8000-000000000008'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'a0000000-0000-4000-8000-000000000003'::uuid, 'على الرحب والسعة! نحن بانتظارك.', now() - interval '382 hours', now() - interval '380 hours'),
('c0000000-0000-4000-8000-000000000009'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'Can you accommodate a vegetarian diet during the trek?', now() - interval '336 hours', now() - interval '334 hours'),
('c0000000-0000-4000-8000-000000000010'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'Of course — our cooks prepare vegetarian options at every meal. Just note it on your booking.', now() - interval '333 hours', now() - interval '331 hours'),
('c0000000-0000-4000-8000-000000000011'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'Done. Also, do we need our own sleeping bags?', now() - interval '316 hours', now() - interval '314 hours'),
('c0000000-0000-4000-8000-000000000012'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'a0000000-0000-4000-8000-000000000005'::uuid, 'You can rent one from us for a small fee, or bring your own.', now() - interval '310 hours', now() - interval '308 hours'),
('c0000000-0000-4000-8000-000000000013'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'ما هو أفضل موسم لهذه الوجهة؟', now() - interval '264 hours', now() - interval '262 hours'),
('c0000000-0000-4000-8000-000000000014'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, 'أفضل فترة من مارس إلى مايو ومن سبتمبر إلى نوفمبر حيث يكون الطقس معتدلاً.', now() - interval '261 hours', now() - interval '259 hours'),
('c0000000-0000-4000-8000-000000000015'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'رائع، سنخطط للحجز في سبتمبر إذاً.', now() - interval '244 hours', null::timestamptz),
('c0000000-0000-4000-8000-000000000016'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'a0000000-0000-4000-8000-000000000007'::uuid, 'اختيار موفق! مقاعد سبتمبر تنفد سريعاً، ننصح بالحجز المبكر.', now() - interval '238 hours', now() - interval '236 hours'),
('c0000000-0000-4000-8000-000000000017'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'Is airport pickup included for early morning arrivals?', now() - interval '192 hours', now() - interval '190 hours'),
('c0000000-0000-4000-8000-000000000018'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, 'Yes — pickup is included for any arrival time. Your driver tracks the flight automatically.', now() - interval '189 hours', now() - interval '187 hours'),
('c0000000-0000-4000-8000-000000000019'::uuid, 'a0000000-0000-4000-8000-000000000009'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'That is very convenient, thanks!', now() - interval '172 hours', now() - interval '170 hours'),
('c0000000-0000-4000-8000-000000000020'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'هل يمكن تقسيط المبلغ على دفعتين؟', now() - interval '120 hours', now() - interval '118 hours'),
('c0000000-0000-4000-8000-000000000021'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'نعم، يمكنك دفع عربون 25% الآن والباقي قبل 30 يوماً من المغادرة.', now() - interval '117 hours', now() - interval '115 hours'),
('c0000000-0000-4000-8000-000000000022'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'تمام، سأكمل الحجز اليوم إن شاء الله.', now() - interval '100 hours', null::timestamptz)
) v(id, s, r, content, created, read)
where not exists (select 1 from public.messages ms where ms.id = v.id);

-- ---- agency deals ----
insert into public.deals (id, agency_id, package_id, title, discount_percentage, start_date, end_date, status)
select v.id, v.aid, v.pkg, v.title, v.disc, v.sd, v.ed, v.status from (values
('f0000000-0000-4000-8000-000000000001'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'Greek Islands Early Bird — 15% Off', 15, date '2026-06-15', date '2026-08-15', 'active'),
('f0000000-0000-4000-8000-000000000002'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 'Japan Golden Route Launch Offer', 12, date '2026-07-01', date '2026-09-01', 'active'),
('f0000000-0000-4000-8000-000000000003'::uuid, 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 'Amalfi Spring Special', 10, date '2026-03-01', date '2026-05-01', 'expired'),
('f0000000-0000-4000-8000-000000000004'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'Cappadocia Sunrise Deal — 12% Off', 12, date '2026-07-05', date '2026-08-31', 'active'),
('f0000000-0000-4000-8000-000000000005'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'Desert Nights Summer Promo', 18, date '2026-08-01', date '2026-09-30', 'scheduled'),
('f0000000-0000-4000-8000-000000000006'::uuid, '94edd52e-2ec5-4337-8562-1f498814dc43'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'Nile Winter Escape', 15, date '2026-01-10', date '2026-03-01', 'expired'),
('f0000000-0000-4000-8000-000000000007'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'd0000000-0000-4000-8000-000000000010'::uuid, 'Inca Trail 2026 Permits — 10% Off', 10, date '2026-06-20', date '2026-08-20', 'active'),
('f0000000-0000-4000-8000-000000000008'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'Rockies Autumn Colors Promo', 14, date '2026-08-15', date '2026-10-15', 'scheduled'),
('f0000000-0000-4000-8000-000000000009'::uuid, '4260abb8-44d7-4620-8e65-5a1ffe588550'::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'Alaska Last Cabins — 20% Off', 20, date '2026-04-01', date '2026-05-20', 'expired')
) v(id, aid, pkg, title, disc, sd, ed, status)
where not exists (select 1 from public.deals dl where dl.id = v.id);

-- ---- monthly agency payouts computed from real paid bookings ----
insert into public.agency_payouts (agency_id, period_start, period_end, amount, commission_rate, status, processed_at, processed_by, payment_reference, created_at)
select p.agency_id,
  date_trunc('month', b.created_at)::date,
  (date_trunc('month', b.created_at) + interval '1 month - 1 day')::date,
  round(sum(b.total_price) * (1 - coalesce(a.commission_rate, 0.12)), 2),
  coalesce(a.commission_rate, 0.12),
  case when date_trunc('month', b.created_at) < date_trunc('month', now()) then 'processed' else 'pending' end,
  case when date_trunc('month', b.created_at) < date_trunc('month', now()) then date_trunc('month', b.created_at) + interval '1 month 4 days' end,
  case when date_trunc('month', b.created_at) < date_trunc('month', now()) then '64160960-eea9-429f-9dfe-2a5ec0854725'::uuid end,
  'PO-' || to_char(date_trunc('month', b.created_at), 'YYYYMM') || '-' || upper(substr(p.agency_id::text, 1, 4)),
  least(date_trunc('month', b.created_at) + interval '1 month 2 days', now())
from public.package_bookings b
join public.packages p on p.id = b.package_id
join public.travel_agencies a on a.id = p.agency_id
where b.payment_status = 'paid'
and not exists (select 1 from public.agency_payouts ap where ap.agency_id = p.agency_id and ap.period_start = date_trunc('month', b.created_at)::date)
group by p.agency_id, a.commission_rate, date_trunc('month', b.created_at);

-- ---- platform_stats: rebuilt from the real seeded rows (last 6 months) ----
delete from public.platform_stats;
insert into public.platform_stats (stat_date, total_bookings, total_revenue, new_travelers, new_agencies, active_packages)
select gs::date,
  (select count(*) from public.package_bookings b where date_trunc('month', b.created_at) = gs),
  (select coalesce(sum(b.total_price), 0) from public.package_bookings b where date_trunc('month', b.created_at) = gs and b.payment_status = 'paid'),
  (select count(*) from public.travelers t where date_trunc('month', t.created_at) = gs),
  (select count(*) from public.travel_agencies a where date_trunc('month', a.created_at) = gs),
  (select count(*) from public.packages where status = 'published')
from generate_series(date '2026-02-01', date '2026-07-01', interval '1 month') gs;

-- ---- agency aggregate rating derived from real package reviews ----
update public.travel_agencies a set
  rating = coalesce((select round(avg(r.rating), 2) from public.reviews r join public.packages p on p.id = r.package_id where p.agency_id = a.id), 0),
  total_reviews = coalesce((select count(*) from public.reviews r join public.packages p on p.id = r.package_id where p.agency_id = a.id), 0);

-- ---- admin activity + pending actions ----
insert into public.admin_activity_logs (user_id, user_name, action_type, action_description, entity_type, entity_id, created_at)
select '64160960-eea9-429f-9dfe-2a5ec0854725', 'Basem Alsaadi', 'agency_approved', 'Approved agency Ocean Voyages Ltd after license verification', 'agency', 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e', now() - interval '26 days'
where not exists (select 1 from public.admin_activity_logs where action_description = 'Approved agency Ocean Voyages Ltd after license verification');
insert into public.admin_activity_logs (user_id, user_name, action_type, action_description, entity_type, entity_id, created_at)
select '64160960-eea9-429f-9dfe-2a5ec0854725', 'Basem Alsaadi', 'package_published', 'Approved and published package Japan Golden Route', 'package', 'd0000000-0000-4000-8000-000000000005', now() - interval '20 days'
where not exists (select 1 from public.admin_activity_logs where action_description = 'Approved and published package Japan Golden Route');
insert into public.admin_activity_logs (user_id, user_name, action_type, action_description, entity_type, entity_id, created_at)
select '64160960-eea9-429f-9dfe-2a5ec0854725', 'Basem Alsaadi', 'package_published', 'Approved and published package Cappadocia Balloons & Caves', 'package', 'd0000000-0000-4000-8000-000000000006', now() - interval '18 days'
where not exists (select 1 from public.admin_activity_logs where action_description = 'Approved and published package Cappadocia Balloons & Caves');
insert into public.admin_activity_logs (user_id, user_name, action_type, action_description, entity_type, entity_id, created_at)
select '64160960-eea9-429f-9dfe-2a5ec0854725', 'Basem Alsaadi', 'payout_processed', 'Processed June payouts for 3 agencies', 'payout', null, now() - interval '6 days'
where not exists (select 1 from public.admin_activity_logs where action_description = 'Processed June payouts for 3 agencies');
insert into public.admin_activity_logs (user_id, user_name, action_type, action_description, entity_type, entity_id, created_at)
select '64160960-eea9-429f-9dfe-2a5ec0854725', 'Basem Alsaadi', 'review_moderated', 'Reviewed flagged review and kept it published', 'review', null, now() - interval '4 days'
where not exists (select 1 from public.admin_activity_logs where action_description = 'Reviewed flagged review and kept it published');
insert into public.admin_activity_logs (user_id, user_name, action_type, action_description, entity_type, entity_id, created_at)
select '64160960-eea9-429f-9dfe-2a5ec0854725', 'Basem Alsaadi', 'traveler_updated', 'Reset password for traveler support request', 'traveler', null, now() - interval '2 days'
where not exists (select 1 from public.admin_activity_logs where action_description = 'Reset password for traveler support request');
insert into public.admin_pending_actions (action_type, title, description, priority, status, entity_type, entity_id)
select 'agency_approval', 'Verify agency: Ask Tourist', 'New agency signup awaiting license verification and approval.', 'high', 'pending', 'agency', '7fa12cf1-d02a-4d0e-8fde-77124f1c6168'
where not exists (select 1 from public.admin_pending_actions where title = 'Verify agency: Ask Tourist');
insert into public.admin_pending_actions (action_type, title, description, priority, status, entity_type, entity_id)
select 'payout_review', 'July payouts awaiting processing', 'Monthly payouts for the current period are pending review.', 'medium', 'pending', 'payout', null
where not exists (select 1 from public.admin_pending_actions where title = 'July payouts awaiting processing');
insert into public.admin_pending_actions (action_type, title, description, priority, status, entity_type, entity_id)
select 'content_review', 'Review updated Terms of Service draft', 'Legal page draft edited and awaiting publication.', 'low', 'pending', 'content', null
where not exists (select 1 from public.admin_pending_actions where title = 'Review updated Terms of Service draft');
