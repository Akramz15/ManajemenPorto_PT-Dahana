create table public.kajian_tasks (
  id          uuid              not null default gen_random_uuid() primary key,
  divisi      text              not null check (divisi in ('komersial', 'pertahanan')),
  nama_kajian text              not null,
  assigned_to uuid              references auth.users(id),
  status      public.task_status not null default 'not_started',
  tahapan     text,
  notes       text,
  updated_at  timestamptz       not null default now()
);

alter table public.kajian_tasks enable row level security;

create policy "kt_all_view"
  on public.kajian_tasks for select
  using (auth.uid() is not null);

create policy "kt_assigned_update"
  on public.kajian_tasks for update
  using (auth.uid() = assigned_to);

create policy "kt_all_insert"
  on public.kajian_tasks for insert
  with check (auth.uid() is not null);

create index idx_kt_divisi on public.kajian_tasks(divisi);
