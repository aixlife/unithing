create table if not exists public.site_visitors (
  id text primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.site_daily_visitors (
  day date not null,
  visitor_id text not null references public.site_visitors(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (day, visitor_id)
);

create index if not exists site_daily_visitors_day_idx
  on public.site_daily_visitors (day);

comment on table public.site_visitors is
  'Anonymous browser-level visitor ids for lightweight UNITHING visit counting.';

comment on table public.site_daily_visitors is
  'One row per anonymous visitor id per KST day for Today and cumulative visit stats.';

alter table public.site_visitors enable row level security;
alter table public.site_daily_visitors enable row level security;

drop policy if exists site_visitors_no_anon_direct_access on public.site_visitors;
create policy site_visitors_no_anon_direct_access
  on public.site_visitors
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists site_daily_visitors_no_anon_direct_access on public.site_daily_visitors;
create policy site_daily_visitors_no_anon_direct_access
  on public.site_daily_visitors
  for all
  to anon
  using (false)
  with check (false);
