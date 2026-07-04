-- Arabic content columns for the traveler-facing catalog.
-- Additive and nullable: English remains the fallback when a translation
-- is absent (see src/lib/localized.ts pickLocalized).

alter table public.packages
  add column if not exists title_ar text,
  add column if not exists description_ar text,
  add column if not exists destination_ar text,
  add column if not exists inclusions_ar text[],
  add column if not exists exclusions_ar text[];

alter table public.itineraries
  add column if not exists title_ar text,
  add column if not exists description_ar text,
  add column if not exists activities_ar text[];

comment on column public.packages.title_ar is 'Arabic translation of title; null falls back to title';
comment on column public.packages.description_ar is 'Arabic translation of description';
comment on column public.packages.destination_ar is 'Arabic translation of destination';
comment on column public.packages.inclusions_ar is 'Arabic translation of inclusions';
comment on column public.packages.exclusions_ar is 'Arabic translation of exclusions';
comment on column public.itineraries.title_ar is 'Arabic translation of title';
comment on column public.itineraries.description_ar is 'Arabic translation of description';
comment on column public.itineraries.activities_ar is 'Arabic translation of activities';
