-- Package add-ons: priced optional extras a traveler selects at booking.
-- First use case: international flights as an optional paid add-on (the
-- third flight_option state deferred from Wave C); also the foundation for
-- honeymoon extras, solo supplements, transfers, and insurance.
--
-- Bookings keep a jsonb SNAPSHOT of the selected add-ons (name + price at
-- booking time), so agencies can freely edit or remove add-ons later without
-- corrupting financial history — and save_package can replace the collection
-- atomically like every other child table.

create table if not exists public.package_addons (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  name text not null,
  name_ar text,
  price numeric not null check (price >= 0),
  per_person boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_package_addons_package on public.package_addons(package_id);

alter table public.package_addons enable row level security;

-- Add-ons render on public package pages.
create policy "Anyone can view package addons" on public.package_addons
  for select using (true);

-- Owning agency manages its package's add-ons.
create policy "Agencies manage own package addons" on public.package_addons
  for all
  using (exists (select 1 from public.packages p where p.id = package_id and p.agency_id = (select auth.uid())))
  with check (exists (select 1 from public.packages p where p.id = package_id and p.agency_id = (select auth.uid())));

-- Admins manage all.
create policy "Admins manage all package addons" on public.package_addons
  for all
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

create trigger update_package_addons_updated_at
  before update on public.package_addons
  for each row execute function public.update_updated_at_column();

-- Snapshot of the traveler's selected add-ons, written only by the
-- create-booking edge function (service role).
alter table public.package_bookings
  add column if not exists addons jsonb not null default '[]'::jsonb;

-- Flights can now be offered as an optional paid add-on.
alter table public.packages drop constraint if exists packages_flight_option_check;
alter table public.packages
  add constraint packages_flight_option_check
  check (flight_option in ('not_included','included','optional'));

-- save_package v5: sync add-ons like the other child collections.
create or replace function public.save_package(
  p_package_id uuid,
  p_data jsonb,
  p_submit_for_review boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pid uuid;
  v_old_status text;
  v_basic jsonb := coalesce(p_data->'basicInfo', '{}'::jsonb);
  v_pricing jsonb := coalesce(p_data->'pricing', '{}'::jsonb);
begin
  if v_uid is null or not public.has_role(v_uid, 'agency') then
    raise exception 'Only travel agencies can save packages' using errcode = '42501';
  end if;

  if p_package_id is null then
    insert into public.packages (
      agency_id, title, description, destination,
      title_ar, description_ar, destination_ar,
      category, difficulty_level, duration_days, duration_nights, max_participants,
      package_type, flight_option,
      base_price, inclusions, exclusions, inclusions_ar, exclusions_ar,
      highlights,
      cancellation_policy, terms_conditions, status, featured
    ) values (
      v_uid,
      v_basic->>'title', v_basic->>'description', v_basic->>'destination',
      nullif(v_basic->>'title_ar',''), nullif(v_basic->>'description_ar',''), nullif(v_basic->>'destination_ar',''),
      v_basic->>'category', coalesce(v_basic->>'difficulty_level','moderate'),
      coalesce((v_basic->>'duration_days')::int,1), coalesce((v_basic->>'duration_nights')::int,0),
      coalesce((v_basic->>'max_participants')::int,1),
      coalesce(nullif(v_basic->>'package_type',''),'group'),
      coalesce(nullif(v_pricing->>'flight_option',''),'not_included'),
      coalesce((v_pricing->>'base_price')::numeric,0),
      array(select jsonb_array_elements_text(coalesce(v_pricing->'inclusions','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(v_pricing->'exclusions','[]'::jsonb))),
      case when jsonb_array_length(coalesce(v_pricing->'inclusions_ar','[]'::jsonb)) > 0
           then array(select jsonb_array_elements_text(v_pricing->'inclusions_ar')) end,
      case when jsonb_array_length(coalesce(v_pricing->'exclusions_ar','[]'::jsonb)) > 0
           then array(select jsonb_array_elements_text(v_pricing->'exclusions_ar')) end,
      array(select jsonb_array_elements_text(coalesce(v_basic->'highlights','[]'::jsonb))),
      v_pricing->>'cancellation_policy', v_pricing->>'terms_conditions',
      case when p_submit_for_review then 'pending' else 'draft' end,
      false
    ) returning id into v_pid;
  else
    select id, status into v_pid, v_old_status
      from public.packages where id = p_package_id and agency_id = v_uid;
    if v_pid is null then
      raise exception 'Package not found or not owned by you' using errcode = '42501';
    end if;
    update public.packages set
      title = v_basic->>'title',
      description = v_basic->>'description',
      destination = v_basic->>'destination',
      title_ar = nullif(v_basic->>'title_ar',''),
      description_ar = nullif(v_basic->>'description_ar',''),
      destination_ar = nullif(v_basic->>'destination_ar',''),
      category = v_basic->>'category',
      difficulty_level = coalesce(v_basic->>'difficulty_level','moderate'),
      duration_days = coalesce((v_basic->>'duration_days')::int,1),
      duration_nights = coalesce((v_basic->>'duration_nights')::int,0),
      max_participants = coalesce((v_basic->>'max_participants')::int,1),
      package_type = coalesce(nullif(v_basic->>'package_type',''),'group'),
      flight_option = coalesce(nullif(v_pricing->>'flight_option',''),'not_included'),
      base_price = coalesce((v_pricing->>'base_price')::numeric,0),
      inclusions = array(select jsonb_array_elements_text(coalesce(v_pricing->'inclusions','[]'::jsonb))),
      exclusions = array(select jsonb_array_elements_text(coalesce(v_pricing->'exclusions','[]'::jsonb))),
      inclusions_ar = case when jsonb_array_length(coalesce(v_pricing->'inclusions_ar','[]'::jsonb)) > 0
                           then array(select jsonb_array_elements_text(v_pricing->'inclusions_ar')) end,
      exclusions_ar = case when jsonb_array_length(coalesce(v_pricing->'exclusions_ar','[]'::jsonb)) > 0
                           then array(select jsonb_array_elements_text(v_pricing->'exclusions_ar')) end,
      highlights = array(select jsonb_array_elements_text(coalesce(v_basic->'highlights','[]'::jsonb))),
      cancellation_policy = v_pricing->>'cancellation_policy',
      terms_conditions = v_pricing->>'terms_conditions',
      -- Owner decision: content edits to a live package require re-approval.
      -- Departures/seats are managed outside this RPC and stay live.
      status = case
        when p_submit_for_review then 'pending'
        when v_old_status = 'published' then 'pending'
        else status
      end,
      updated_at = now()
    where id = v_pid;
  end if;

  -- Replace child collections atomically.
  delete from public.package_routes where package_id = v_pid;
  insert into public.package_routes (package_id, destination_order, name, name_ar, latitude, longitude, place_id, destination_type, days_spent)
  select v_pid,
    coalesce((e->>'destination_order')::int, (ord-1)::int),
    e->>'name', nullif(e->>'name_ar',''),
    (e->>'latitude')::double precision, (e->>'longitude')::double precision,
    nullif(e->>'place_id',''), e->>'destination_type', coalesce((e->>'days_spent')::int,1)
  from jsonb_array_elements(coalesce(p_data->'routes','[]'::jsonb)) with ordinality as t(e, ord);

  delete from public.itineraries where package_id = v_pid;
  insert into public.itineraries (package_id, day_number, title, description, activities, meals_included, accommodation, transportation, title_ar, description_ar, activities_ar)
  select v_pid,
    coalesce((e->>'day_number')::int, ord::int),
    e->>'title', e->>'description',
    array(select jsonb_array_elements_text(coalesce(e->'activities','[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(e->'meals_included','[]'::jsonb))),
    nullif(e->>'accommodation',''), nullif(e->>'transportation',''),
    nullif(e->>'title_ar',''), nullif(e->>'description_ar',''),
    case when jsonb_array_length(coalesce(e->'activities_ar','[]'::jsonb)) > 0
         then array(select jsonb_array_elements_text(e->'activities_ar')) end
  from jsonb_array_elements(coalesce(p_data->'itinerary','[]'::jsonb)) with ordinality as t(e, ord);

  delete from public.package_media where package_id = v_pid;
  insert into public.package_media (package_id, file_name, file_path, media_type, caption, is_primary, display_order)
  select v_pid,
    e->>'file_name', e->>'file_path', coalesce(e->>'media_type','image'),
    nullif(e->>'caption',''), coalesce((e->>'is_primary')::boolean, false),
    coalesce((e->>'display_order')::int, (ord-1)::int)
  from jsonb_array_elements(coalesce(p_data->'media','[]'::jsonb)) with ordinality as t(e, ord);

  delete from public.package_addons where package_id = v_pid;
  insert into public.package_addons (package_id, name, name_ar, price, per_person, display_order)
  select v_pid,
    e->>'name', nullif(e->>'name_ar',''),
    coalesce((e->>'price')::numeric, 0),
    coalesce((e->>'per_person')::boolean, true),
    coalesce((e->>'display_order')::int, (ord-1)::int)
  from jsonb_array_elements(coalesce(p_data->'addons','[]'::jsonb)) with ordinality as t(e, ord)
  where coalesce(trim(e->>'name'), '') <> '';

  -- Owner decision (hard gate): a package must have at least one upcoming
  -- scheduled departure before it can be submitted for review.
  if p_submit_for_review and not exists (
    select 1 from public.package_departures
    where package_id = v_pid
      and status = 'scheduled'
      and departure_date >= current_date
  ) then
    raise exception 'At least one upcoming departure is required before submitting for review'
      using errcode = 'P0001';
  end if;

  return v_pid;
end;
$$;
