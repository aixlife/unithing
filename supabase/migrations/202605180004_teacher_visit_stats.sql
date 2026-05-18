create table if not exists public.site_teacher_visitors (
  teacher_id uuid primary key references public.teachers(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.site_daily_teacher_visitors (
  day date not null,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (day, teacher_id)
);

create index if not exists site_daily_teacher_visitors_day_idx
  on public.site_daily_teacher_visitors (day);

comment on table public.site_teacher_visitors is
  'One row per logged-in UNITHING teacher/user for accurate cumulative visit counting.';

comment on table public.site_daily_teacher_visitors is
  'One row per logged-in UNITHING teacher/user per KST day for accurate daily visit counting.';

alter table public.site_teacher_visitors enable row level security;
alter table public.site_daily_teacher_visitors enable row level security;

drop policy if exists site_teacher_visitors_no_anon_direct_access on public.site_teacher_visitors;
create policy site_teacher_visitors_no_anon_direct_access
  on public.site_teacher_visitors
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists site_daily_teacher_visitors_no_anon_direct_access on public.site_daily_teacher_visitors;
create policy site_daily_teacher_visitors_no_anon_direct_access
  on public.site_daily_teacher_visitors
  for all
  to anon
  using (false)
  with check (false);

drop function if exists public.record_site_teacher_visit(uuid, date);
drop function if exists public.get_site_teacher_visit_stats(date);

create function public.get_site_teacher_visit_stats(visit_day date)
returns table(today_count bigint, total_count bigint, day date)
language sql
security definer
set search_path = public
as $$
  select
    (
      select count(*)
      from public.site_daily_teacher_visitors sdv
      where sdv.day = $1
    ) as today_count,
    (
      select count(*)
      from public.site_teacher_visitors sv
    ) as total_count,
    $1 as day;
$$;

create function public.record_site_teacher_visit(teacher_id uuid, visit_day date)
returns table(today_count bigint, total_count bigint, day date)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_teacher_visitors (teacher_id, last_seen_at)
  values ($1, now())
  on conflict (teacher_id) do update
    set last_seen_at = excluded.last_seen_at;

  insert into public.site_daily_teacher_visitors (day, teacher_id)
  values ($2, $1)
  on conflict on constraint site_daily_teacher_visitors_pkey do nothing;

  return query
    select stats.today_count, stats.total_count, stats.day
    from public.get_site_teacher_visit_stats($2) as stats;
end;
$$;

grant execute on function public.get_site_teacher_visit_stats(date) to anon, authenticated, service_role;
grant execute on function public.record_site_teacher_visit(uuid, date) to anon, authenticated, service_role;
