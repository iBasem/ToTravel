-- Create reviews table
create table if not exists public.reviews (
  id uuid not null default gen_random_uuid(),
  traveler_id uuid not null references public.travelers(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  booking_id uuid not null references public.package_bookings(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone not null default now(),
  constraint reviews_pkey primary key (id),
  constraint reviews_booking_id_key unique (booking_id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Travelers can insert their own reviews" on public.reviews for insert with check (auth.uid() = traveler_id);
create policy "Travelers can update their own reviews" on public.reviews for update using (auth.uid() = traveler_id);
create policy "Travelers can delete their own reviews" on public.reviews for delete using (auth.uid() = traveler_id);

-- Add rating columns to packages
alter table public.packages add column if not exists average_rating numeric(3,2) default 0;
alter table public.packages add column if not exists total_reviews integer default 0;

-- Function to update package rating
create or replace function public.update_package_rating()
returns trigger as $$
declare
  pkg_id uuid;
begin
  if (TG_OP = 'DELETE') then
    pkg_id := old.package_id;
  else
    pkg_id := new.package_id;
  end if;

  update public.packages
  set 
    average_rating = (select coalesce(avg(rating), 0) from public.reviews where package_id = pkg_id),
    total_reviews = (select count(*) from public.reviews where package_id = pkg_id)
  where id = pkg_id;
  
  return null;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
after insert or update or delete on public.reviews
for each row execute function public.update_package_rating();
