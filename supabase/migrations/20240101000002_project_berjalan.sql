create table public.project_berjalan (
  id            uuid        not null default gen_random_uuid() primary key,
  divisi        text        not null check (divisi in ('komersial', 'pertahanan')),
  nama_proyek   text        not null,
  nilai_kontrak bigint,
  tgl_mulai     date,
  tgl_selesai   date,
  created_by    uuid        references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.project_berjalan enable row level security;

create policy "pb_all_view"
  on public.project_berjalan for select
  using (auth.uid() is not null);

create policy "pb_all_insert"
  on public.project_berjalan for insert
  with check (auth.uid() is not null);

create policy "pb_creator_update"
  on public.project_berjalan for update
  using (auth.uid() = created_by);

create index idx_pb_divisi on public.project_berjalan(divisi);
