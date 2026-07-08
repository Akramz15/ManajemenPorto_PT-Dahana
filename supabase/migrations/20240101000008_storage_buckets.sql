insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  false,
  52428800,
  array['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg', 'image/png', 'image/webp']
);

create policy "docs_bucket_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'project-documents'
    and auth.uid() is not null
  );

create policy "docs_bucket_auth_download"
  on storage.objects for select
  using (
    bucket_id = 'project-documents'
    and auth.uid() is not null
  );

create policy "docs_bucket_all_delete"
  on storage.objects for delete
  using (
    bucket_id = 'project-documents'
    and auth.uid() is not null
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'excel-uploads',
  'excel-uploads',
  false,
  20971520,
  array['application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

create policy "excel_bucket_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'excel-uploads'
    and auth.uid() is not null
  );

create policy "excel_bucket_auth_read"
  on storage.objects for select
  using (
    bucket_id = 'excel-uploads'
    and auth.uid() is not null
  );
