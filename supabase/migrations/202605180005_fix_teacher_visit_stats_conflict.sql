drop function if exists public.record_site_teacher_visit(uuid, date);

create function public.record_site_teacher_visit(teacher_id uuid, visit_day date)
returns table(today_count bigint, total_count bigint, day date)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_teacher_visitors (teacher_id, last_seen_at)
  values ($1, now())
  on conflict on constraint site_teacher_visitors_pkey do update
    set last_seen_at = excluded.last_seen_at;

  insert into public.site_daily_teacher_visitors (day, teacher_id)
  values ($2, $1)
  on conflict on constraint site_daily_teacher_visitors_pkey do nothing;

  return query
    select stats.today_count, stats.total_count, stats.day
    from public.get_site_teacher_visit_stats($2) as stats;
end;
$$;

grant execute on function public.record_site_teacher_visit(uuid, date) to anon, authenticated, service_role;
