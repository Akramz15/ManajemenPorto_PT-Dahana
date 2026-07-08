create table public.user_whitelist (
  email    text        primary key,
  added_by text,
  added_at timestamptz not null default now()
);

alter table public.user_whitelist enable row level security;

create policy "whitelist_public_read"
  on public.user_whitelist for select
  using (true);

insert into public.user_whitelist (email, added_by) values
  ('user1@dahana.id', 'admin'),
  ('user2@dahana.id', 'admin'),
  ('user3@dahana.id', 'admin'),
  ('user4@dahana.id', 'admin');
