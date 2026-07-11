-- Package highlights: the wizard's Basic Info step collects marketing
-- highlights but they were silently dropped (no column, not in save_package).
-- Add the column and persist them through the RPC.

alter table public.packages
  add column if not exists highlights text[] not null default '{}';

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
    select id into v_pid from public.packages where id = p_package_id and agency_id = v_uid;
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
      status = case when p_submit_for_review then 'pending' else status end,
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

  return v_pid;
end;
$$;
