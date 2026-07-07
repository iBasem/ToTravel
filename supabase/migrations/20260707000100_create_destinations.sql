-- Destinations catalog: replaces the hardcoded DESTINATION_DATA array in
-- src/features/packages/pages/Destinations.tsx and the destinationCards array
-- in src/features/home/components/DestinationsSection.tsx, plus the entity
-- content that lived in i18n locale files (destinations.items.*).
--
-- kind = 'country'  -> cards on the /destinations page
-- kind = 'region'   -> continent cards on the home page carousel

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null default 'country' check (kind in ('country', 'region')),
  name text not null,
  name_ar text,
  region_label text,        -- e.g. "Southeast Asia" (country cards) / subtitle (region cards)
  region_label_ar text,
  description text,
  description_ar text,
  highlights text[] not null default '{}',
  highlights_ar text[] not null default '{}',
  region_keys text[] not null default '{}',  -- filter keys: europe/asia/africa/americas/oceania
  image_url text,
  color_class text,          -- tailwind bg class used by the home region cards
  display_order integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.destinations enable row level security;

create policy "Anyone can view destinations"
  on public.destinations for select
  using (true);

create policy "Admins can manage destinations"
  on public.destinations for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger update_destinations_updated_at
  before update on public.destinations
  for each row execute function public.update_updated_at_column();

-- Live stats per country destination, computed from real published packages.
-- security_invoker: anon/authenticated only aggregate over packages they can
-- already read (the "Anyone can view published packages" policy).
create view public.destination_stats
  with (security_invoker = true) as
select
  d.id as destination_id,
  d.slug,
  count(p.id)::integer as tour_count,
  avg(p.base_price)::numeric(10, 2) as average_price,
  avg(p.average_rating) filter (where p.total_reviews > 0)::numeric(3, 2) as average_rating
from public.destinations d
left join public.packages p
  on p.status = 'published'
 and (
   p.destination ilike '%' || d.name || '%'
   or (d.name_ar is not null and p.destination_ar ilike '%' || d.name_ar || '%')
 )
where d.kind = 'country'
group by d.id, d.slug;

grant select on public.destination_stats to anon, authenticated;
