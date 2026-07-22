create table public.project_progress_activities (
  id uuid not null default gen_random_uuid() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  month int not null check (month >= 1 and month <= 12),
  year int not null,
  activity_name text not null,
  weight_percentage numeric not null default 0,
  created_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_progress_activities enable row level security;

create policy "ppa_all_view" on public.project_progress_activities for select using (auth.uid() is not null);
create policy "ppa_all_insert" on public.project_progress_activities for insert with check (auth.uid() is not null);
create policy "ppa_all_update" on public.project_progress_activities for update using (auth.uid() is not null);
create policy "ppa_all_delete" on public.project_progress_activities for delete using (auth.uid() is not null);

create index idx_ppa_project_id on public.project_progress_activities(project_id);
create index idx_ppa_month_year on public.project_progress_activities(month, year);
