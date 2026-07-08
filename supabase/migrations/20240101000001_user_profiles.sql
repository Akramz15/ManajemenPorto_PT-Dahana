create table public.user_profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  display_name text        not null,
  role         text        not null default 'member',
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "users_see_all_profiles"
  on public.user_profiles for select
  using (auth.uid() is not null);

create policy "users_update_own_profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "users_insert_own_profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);
