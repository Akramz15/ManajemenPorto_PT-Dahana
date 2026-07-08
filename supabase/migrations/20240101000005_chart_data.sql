create table public.chart_data (
  id          uuid        not null default gen_random_uuid() primary key,
  context     text        not null,
  sub_context text,
  data_json   jsonb       not null,
  source_file text,
  uploaded_by uuid        references auth.users(id),
  created_at  timestamptz not null default now()
);

create index idx_chart_context on public.chart_data(context, sub_context);
create index idx_chart_created_at on public.chart_data(created_at desc);

alter table public.chart_data enable row level security;

create policy "cd_all_view"
  on public.chart_data for select
  using (auth.uid() is not null);

create policy "cd_all_insert"
  on public.chart_data for insert
  with check (auth.uid() is not null);
