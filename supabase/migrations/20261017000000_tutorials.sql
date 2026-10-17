create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  video_url text not null,
  thumbnail_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tutorials_sort_idx
on public.tutorials(sort_order, created_at desc);

alter table public.tutorials enable row level security;
revoke all on table public.tutorials from anon, authenticated;

drop trigger if exists tutorials_set_updated_at on public.tutorials;
create trigger tutorials_set_updated_at before update on public.tutorials
for each row execute function public.set_updated_at();
