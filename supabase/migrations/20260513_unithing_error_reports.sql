create table if not exists public.error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  reporter_teacher_id uuid references public.teachers(id) on delete set null,
  reporter_email text,
  page_path text,
  service_label text,
  visible_error text,
  user_note text,
  user_agent text,
  app_context jsonb,
  client_context jsonb,
  server_context jsonb,
  mail_status text,
  mail_error text
);

create index if not exists error_reports_created_idx
  on public.error_reports (created_at desc);

create index if not exists error_reports_status_created_idx
  on public.error_reports (status, created_at desc);

alter table public.error_reports enable row level security;

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  client_hint text
);

create index if not exists admin_sessions_expires_idx
  on public.admin_sessions (expires_at);

alter table public.admin_sessions enable row level security;
