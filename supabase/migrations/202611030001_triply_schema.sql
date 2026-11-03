create extension if not exists pgcrypto;

create type public.trip_status as enum ('draft', 'planning', 'booked', 'completed', 'archived');
create type public.trip_member_role as enum ('owner', 'editor', 'viewer');
create type public.itinerary_item_kind as enum ('attraction', 'food', 'stay', 'experience', 'transport');
create type public.expense_category as enum ('accommodation', 'food', 'transport', 'activities', 'shopping', 'other');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  home_currency char(3) not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  destination_name text not null check (char_length(destination_name) between 1 and 120),
  country text not null default '',
  origin text not null default '',
  start_date date not null,
  end_date date not null,
  travelers smallint not null default 1 check (travelers between 1 and 12),
  budget_amount numeric(12,2) not null check (budget_amount > 0),
  currency char(3) not null default 'EUR',
  travel_style text not null default 'Slow & scenic',
  interests text[] not null default '{}',
  description text not null default '',
  status public.trip_status not null default 'draft',
  cover_image_url text,
  ai_overview text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  check (end_date >= start_date)
);

create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.trip_member_role not null default 'viewer' check (role <> 'owner'),
  invited_by uuid references auth.users (id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_place_id text not null,
  name text not null,
  country text not null default '',
  formatted_address text,
  latitude double precision,
  longitude double precision,
  category text,
  photo_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_place_id),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_date date not null,
  title text not null default '',
  notes text not null default '',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, day_date),
  unique (id, trip_id)
);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_id uuid not null,
  destination_id uuid references public.destinations (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  kind public.itinerary_item_kind not null default 'experience',
  start_time time,
  duration_minutes smallint check (duration_minutes is null or duration_minutes between 1 and 1440),
  estimated_cost numeric(12,2) not null default 0 check (estimated_cost >= 0),
  currency char(3) not null default 'EUR',
  sort_order smallint not null default 0,
  is_completed boolean not null default false,
  is_ai_suggestion boolean not null default false,
  is_verified boolean not null default false,
  user_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (day_id, trip_id) references public.itinerary_days (id, trip_id) on delete cascade
);

create table public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  destination_id uuid references public.destinations (id) on delete cascade,
  name text not null,
  country text not null default '',
  category text not null default 'destination',
  photo_url text,
  provider text,
  provider_place_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, provider, provider_place_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  itinerary_item_id uuid references public.itinerary_items (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  category public.expense_category not null default 'other',
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'EUR',
  expense_date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  day_id uuid references public.itinerary_days (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  invited_by uuid not null references auth.users (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 320),
  role public.trip_member_role not null default 'viewer' check (role <> 'owner'),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index trips_owner_dates_idx on public.trips (owner_id, start_date);
create index trip_members_user_trip_idx on public.trip_members (user_id, trip_id);
create index itinerary_days_trip_order_idx on public.itinerary_days (trip_id, sort_order);
create index itinerary_items_trip_day_order_idx on public.itinerary_items (trip_id, day_id, sort_order);
create index saved_places_user_created_idx on public.saved_places (user_id, created_at desc);
create index expenses_trip_date_idx on public.expenses (trip_id, expense_date desc);
create index trip_notes_trip_created_idx on public.trip_notes (trip_id, created_at desc);
create index invitations_trip_expiry_idx on public.invitations (trip_id, expires_at);
create index destinations_name_country_idx on public.destinations (name, country);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trips_set_updated_at before update on public.trips
  for each row execute function public.set_updated_at();
create trigger itinerary_days_set_updated_at before update on public.itinerary_days
  for each row execute function public.set_updated_at();
create trigger itinerary_items_set_updated_at before update on public.itinerary_items
  for each row execute function public.set_updated_at();
create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();
create trigger trip_notes_set_updated_at before update on public.trip_notes
  for each row execute function public.set_updated_at();

create function public.can_access_trip(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t
    where t.id = target_trip_id and t.owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.trip_members m
    where m.trip_id = target_trip_id and m.user_id = (select auth.uid())
  );
$$;

create function public.can_edit_trip(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t
    where t.id = target_trip_id and t.owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.trip_members m
    where m.trip_id = target_trip_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'editor')
  );
$$;

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.destinations enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.saved_places enable row level security;
alter table public.expenses enable row level security;
alter table public.trip_notes enable row level security;
alter table public.invitations enable row level security;

create policy "Profiles can be read by authenticated users" on public.profiles
  for select to authenticated using (true);
create policy "Users manage their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Trips are visible to owners and members" on public.trips
  for select to authenticated using (public.can_access_trip(id));
create policy "Users create owned trips" on public.trips
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners edit or delete trips" on public.trips
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners delete trips" on public.trips
  for delete to authenticated using ((select auth.uid()) = owner_id);
create policy "Members can view trip collaborators" on public.trip_members
  for select to authenticated using (public.can_access_trip(trip_id));
create policy "Trip owners manage collaborators" on public.trip_members
  for all to authenticated using (exists (
    select 1 from public.trips t where t.id = trip_id and t.owner_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.trips t where t.id = trip_id and t.owner_id = (select auth.uid())
  ));
create policy "Verified destination catalog is visible" on public.destinations
  for select to authenticated using (true);
create policy "Trip members view itinerary days" on public.itinerary_days
  for select to authenticated using (public.can_access_trip(trip_id));
create policy "Trip editors manage itinerary days" on public.itinerary_days
  for all to authenticated using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));
create policy "Trip members view itinerary items" on public.itinerary_items
  for select to authenticated using (public.can_access_trip(trip_id));
create policy "Trip editors manage itinerary items" on public.itinerary_items
  for all to authenticated using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));
create policy "Users manage their own saved places" on public.saved_places
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Trip members view expenses" on public.expenses
  for select to authenticated using (public.can_access_trip(trip_id));
create policy "Trip editors manage expenses" on public.expenses
  for all to authenticated using (public.can_edit_trip(trip_id)) with check (
    public.can_edit_trip(trip_id) and (select auth.uid()) = created_by
  );
create policy "Trip members view notes" on public.trip_notes
  for select to authenticated using (public.can_access_trip(trip_id));
create policy "Trip editors manage notes" on public.trip_notes
  for all to authenticated using (public.can_edit_trip(trip_id)) with check (
    public.can_edit_trip(trip_id) and (select auth.uid()) = author_id
  );
create policy "Trip owners manage invitations" on public.invitations
  for all to authenticated using (exists (
    select 1 from public.trips t where t.id = trip_id and t.owner_id = (select auth.uid())
  )) with check (
    (select auth.uid()) = invited_by
    and exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = (select auth.uid()))
  );

-- Triply stores only user-owned uploads in this private bucket.
insert into storage.buckets (id, name, public)
values ('triply-uploads', 'triply-uploads', false)
on conflict (id) do nothing;

create policy "Trip owners read their uploads" on storage.objects
  for select to authenticated using (
    bucket_id = 'triply-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Trip owners upload their files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'triply-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Trip owners update their uploads" on storage.objects
  for update to authenticated using (
    bucket_id = 'triply-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'triply-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Trip owners delete their uploads" on storage.objects
  for delete to authenticated using (
    bucket_id = 'triply-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
