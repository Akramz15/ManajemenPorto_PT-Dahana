# Modul 02 — Supabase: Database, Auth & Whitelist

## 1. Skema Database

### Diagram Entitas

```
users (Supabase Auth)          ← built-in, hanya 4 user
    │
    ├─── user_profiles          ← display name, avatar, role
    │
    ├─── project_berjalan       ← data proyek aktif
    │       ├── documents       ← metadata file dokumen
    │       └── progress_tasks  ← status tugas per user
    │
    ├─── project_kajian         ← data proyek perencanaan
    │       └── kajian_tasks    ← progress kajian per user
    │
    ├─── chart_data             ← hasil ekstraksi Excel (JSONB)
    │
    └─── upload_logs            ← audit log setiap upload
```

---

## 2. SQL Migrations

### 2.1 Tabel `user_profiles`
```sql
-- supabase/migrations/001_user_profiles.sql
create table public.user_profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  role        text not null default 'member',
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "Users see all profiles"
  on public.user_profiles for select
  using (auth.uid() is not null);

create policy "Users update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);
```

### 2.2 Tabel `project_berjalan`
```sql
-- supabase/migrations/002_project_berjalan.sql
create table public.project_berjalan (
  id          uuid default gen_random_uuid() primary key,
  divisi      text not null check (divisi in ('komersial', 'pertahanan')),
  nama_proyek text not null,
  nilai_kontrak bigint,
  tgl_mulai   date,
  tgl_selesai date,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.project_berjalan enable row level security;

create policy "All authenticated users can view"
  on public.project_berjalan for select
  using (auth.uid() is not null);

create policy "All authenticated users can insert"
  on public.project_berjalan for insert
  with check (auth.uid() is not null);

create policy "Creator can update"
  on public.project_berjalan for update
  using (auth.uid() = created_by);
```

### 2.3 Tabel `documents`
```sql
-- supabase/migrations/003_documents.sql
create table public.documents (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references public.project_berjalan(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  file_size       bigint,
  uploaded_by     uuid references auth.users(id),
  uploaded_at     timestamptz default now()
);

alter table public.documents enable row level security;

create policy "All authenticated users can view documents"
  on public.documents for select using (auth.uid() is not null);

create policy "All authenticated users can upload"
  on public.documents for insert with check (auth.uid() is not null);
```

### 2.4 Tabel `progress_tasks`
```sql
-- supabase/migrations/004_progress_tasks.sql
create type task_status as enum ('not_started', 'in_progress', 'done', 'blocked');

create table public.progress_tasks (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references public.project_berjalan(id) on delete cascade,
  assigned_to uuid references auth.users(id),
  title       text not null,
  status      task_status default 'not_started',
  notes       text,
  updated_at  timestamptz default now()
);

alter table public.progress_tasks enable row level security;

create policy "All users view all tasks"
  on public.progress_tasks for select using (auth.uid() is not null);

create policy "Assigned user can update task"
  on public.progress_tasks for update
  using (auth.uid() = assigned_to);

create policy "Any user can create task"
  on public.progress_tasks for insert with check (auth.uid() is not null);
```

### 2.5 Tabel `chart_data`
```sql
-- supabase/migrations/005_chart_data.sql
create table public.chart_data (
  id          uuid default gen_random_uuid() primary key,
  context     text not null,
  sub_context text,
  data_json   jsonb not null,
  source_file text,
  uploaded_by uuid references auth.users(id),
  created_at  timestamptz default now()
);

create index idx_chart_data_context on public.chart_data(context, sub_context);

alter table public.chart_data enable row level security;

create policy "All authenticated users can view chart data"
  on public.chart_data for select using (auth.uid() is not null);

create policy "All authenticated users can insert chart data"
  on public.chart_data for insert with check (auth.uid() is not null);
```

### 2.6 Tabel `kajian_tasks`
```sql
-- supabase/migrations/006_kajian_tasks.sql
create table public.kajian_tasks (
  id          uuid default gen_random_uuid() primary key,
  divisi      text not null check (divisi in ('komersial', 'pertahanan')),
  nama_kajian text not null,
  assigned_to uuid references auth.users(id),
  status      task_status default 'not_started',
  tahapan     text,
  notes       text,
  updated_at  timestamptz default now()
);

alter table public.kajian_tasks enable row level security;

create policy "All users view kajian tasks"
  on public.kajian_tasks for select using (auth.uid() is not null);

create policy "Assigned user updates kajian task"
  on public.kajian_tasks for update using (auth.uid() = assigned_to);

create policy "Any user creates kajian task"
  on public.kajian_tasks for insert with check (auth.uid() is not null);
```

---

## 3. Sistem Whitelist (Closed System)

### Strategi: Supabase Auth + Whitelist Table

```sql
-- supabase/migrations/007_whitelist.sql
create table public.user_whitelist (
  email text primary key,
  added_by text,
  added_at timestamptz default now()
);

-- Isi dengan 4 user yang diizinkan
insert into public.user_whitelist (email, added_by) values
  ('user1@dahana.id', 'admin'),
  ('user2@dahana.id', 'admin'),
  ('user3@dahana.id', 'admin'),
  ('user4@dahana.id', 'admin');
```

### Auth Hook: Validasi Whitelist saat Login
```sql
-- Supabase Auth Hook (via Database Webhook atau Edge Function)
-- Cek apakah email ada di whitelist sebelum session dibuat
create or replace function public.check_user_whitelist()
returns trigger language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.user_whitelist where email = new.email
  ) then
    raise exception 'Email tidak terdaftar dalam sistem.';
  end if;
  return new;
end;
$$;
```

---

## 4. Supabase Storage Buckets

```sql
-- Buat bucket untuk dokumen proyek
insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', false);

-- Policy: User terotentikasi bisa upload dan download
create policy "Authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'project-documents' and auth.uid() is not null);

create policy "Authenticated download"
  on storage.objects for select
  using (bucket_id = 'project-documents' and auth.uid() is not null);

-- Bucket untuk file Excel (private)
insert into storage.buckets (id, name, public)
values ('excel-uploads', 'excel-uploads', false);

create policy "Authenticated excel upload"
  on storage.objects for insert
  with check (bucket_id = 'excel-uploads' and auth.uid() is not null);
```

---

## 5. Supabase Realtime

### Enable Realtime untuk tabel kritis
```sql
-- Enable realtime untuk tabel yang membutuhkan sinkronisasi live
alter publication supabase_realtime add table public.progress_tasks;
alter publication supabase_realtime add table public.kajian_tasks;
alter publication supabase_realtime add table public.chart_data;
alter publication supabase_realtime add table public.documents;
```

---

## 6. Supabase Client (Frontend)

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.types";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## 📌 Prompt AI — Modul 02

```
Kamu membangun sistem autentikasi tertutup untuk Dahana BizPort
(hanya 4 user yang diizinkan).

Gunakan Supabase Auth + whitelist table.

Tugas:
1. Buat file supabase/migrations/ dengan semua SQL yang diperlukan
   (whitelist, user_profiles, project_berjalan, documents,
   progress_tasks, chart_data, kajian_tasks)
2. Buat src/lib/supabase.ts sebagai typed Supabase client
3. Buat src/hooks/useAuth.ts yang berisi:
   - signIn(email, password) dengan pengecekan whitelist
   - signOut()
   - session state yang persisten
   - redirect ke /select-module setelah login berhasil
4. Buat src/pages/LoginPage.tsx dengan UI clean light mode,
   logo Dahana, form email/password, dan error state
   menggunakan TailwindCSS

Tidak ada komentar yang tidak perlu. Kode harus clean dan production-ready.
```
