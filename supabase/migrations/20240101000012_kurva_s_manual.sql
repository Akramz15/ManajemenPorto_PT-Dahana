create table public.kurva_s_manual (
  id uuid not null default gen_random_uuid() primary key,
  project_id text not null, -- using text to accommodate custom porto ids like 'porto-lainnya-streamlining'
  nama_pekerjaan text not null,
  bulan int not null check (bulan >= 1 and bulan <= 12),
  bobot_rencana_persen numeric not null default 0,
  bobot_realisasi_persen numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kurva_s_manual enable row level security;

create policy "kurva_s_manual_all_view" on public.kurva_s_manual for select using (auth.uid() is not null);
create policy "kurva_s_manual_all_insert" on public.kurva_s_manual for insert with check (auth.uid() is not null);
create policy "kurva_s_manual_all_update" on public.kurva_s_manual for update using (auth.uid() is not null);
create policy "kurva_s_manual_all_delete" on public.kurva_s_manual for delete using (auth.uid() is not null);

create index idx_ksm_project_id on public.kurva_s_manual(project_id);
create index idx_ksm_bulan on public.kurva_s_manual(bulan);
