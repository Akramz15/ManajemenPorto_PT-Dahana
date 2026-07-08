create table public.documents (
  id           uuid        not null default gen_random_uuid() primary key,
  project_id   uuid        references public.project_berjalan(id) on delete cascade,
  storage_path text        not null,
  file_name    text        not null,
  file_size    bigint,
  uploaded_by  uuid        references auth.users(id),
  uploaded_at  timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "docs_all_view"
  on public.documents for select
  using (auth.uid() is not null);

create policy "docs_all_insert"
  on public.documents for insert
  with check (auth.uid() is not null);

create policy "docs_all_delete"
  on public.documents for delete
  using (auth.uid() is not null);

create policy "docs_all_update"
  on public.documents for update
  using (auth.uid() is not null);

create index idx_docs_project_id on public.documents(project_id);
