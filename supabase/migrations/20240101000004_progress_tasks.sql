create type public.task_status as enum (
  'not_started',
  'in_progress',
  'done',
  'blocked'
);

create table public.progress_tasks (
  id          uuid              not null default gen_random_uuid() primary key,
  project_id  uuid              references public.project_berjalan(id) on delete cascade,
  assigned_to uuid              references auth.users(id),
  title       text              not null,
  status      public.task_status not null default 'not_started',
  notes       text,
  updated_at  timestamptz       not null default now()
);

alter table public.progress_tasks enable row level security;

create policy "pt_all_view"
  on public.progress_tasks for select
  using (auth.uid() is not null);

create policy "pt_assigned_update"
  on public.progress_tasks for update
  using (auth.uid() = assigned_to);

create policy "pt_all_insert"
  on public.progress_tasks for insert
  with check (auth.uid() is not null);

create index idx_pt_project_id on public.progress_tasks(project_id);
create index idx_pt_assigned_to on public.progress_tasks(assigned_to);
