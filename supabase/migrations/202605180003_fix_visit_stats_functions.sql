create or replace function public.get_site_visit_stats(p_visit_day date)
returns table(today_count bigint, total_count bigint, day date)
language sql
security definer
set search_path = public
as $$
  select
    (
      select count(*)
      from public.site_daily_visitors sdv
      where sdv.day = p_visit_day
    ) as today_count,
    (
      select count(*)
      from public.site_visitors sv
    ) as total_count,
    p_visit_day as day;
$$;

create or replace function public.record_site_visit(p_visitor_id text, p_visit_day date)
returns table(today_count bigint, total_count bigint, day date)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor_id is null or p_visitor_id !~* '^[0-9a-f-]{36}$' then
    raise exception 'invalid visitor id' using errcode = '22023';
  end if;

  insert into public.site_visitors (id, last_seen_at)
  values (p_visitor_id, now())
  on conflict (id) do update
    set last_seen_at = excluded.last_seen_at;

  insert into public.site_daily_visitors (day, visitor_id)
  values (p_visit_day, p_visitor_id)
  on conflict on constraint site_daily_visitors_pkey do nothing;

  return query
    select stats.today_count, stats.total_count, stats.day
    from public.get_site_visit_stats(p_visit_day) as stats;
end;
$$;

grant execute on function public.get_site_visit_stats(date) to anon, authenticated, service_role;
grant execute on function public.record_site_visit(text, date) to anon, authenticated, service_role;
