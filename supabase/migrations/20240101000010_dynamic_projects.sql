create table public.projects (
  id uuid not null default gen_random_uuid() primary key,
  divisi text not null check (divisi in ('komersial', 'pertahanan')),
  kategori text not null check (kategori in ('berjalan', 'kajian')),
  nama_proyek text not null,
  mitra text,
  nilai_kontrak bigint,
  created_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_all_view" on public.projects for select using (auth.uid() is not null);
create policy "projects_all_insert" on public.projects for insert with check (auth.uid() is not null);
create policy "projects_all_update" on public.projects for update using (auth.uid() is not null);
create policy "projects_all_delete" on public.projects for delete using (auth.uid() is not null);

-- Modify existing progress_tasks to point to projects
alter table public.progress_tasks drop constraint if exists progress_tasks_project_id_fkey;
alter table public.progress_tasks add constraint progress_tasks_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;

-- Modify existing documents to point to projects
alter table public.documents drop constraint if exists documents_project_id_fkey;
alter table public.documents add constraint documents_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;

-- For kajian_tasks, add project_id
alter table public.kajian_tasks add column project_id uuid references public.projects(id) on delete cascade;
