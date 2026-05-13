# Supabase Schema And RLS Baseline

Updated: 2026-05-13

## Current App Usage

The integrated app uses Supabase in server routes through `src/lib/supabaseServer.ts`.

- Preferred production key: `SUPABASE_SERVICE_ROLE_KEY`
- Fallback key for local/dev only: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The code reads and writes these tables:

- `teachers`
- `students`
- `error_reports`
- `admin_sessions`

`students.segibu_analysis` stores the structured Service3 analysis used by the integrated report view and the counseling roadmap.

## Tables

### `teachers`

Expected columns based on current code:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Primary key. |
| `email` | `text` | yes | Unique. Used as Google identity key. |
| `name` | `text` | no | Upserted from Google profile. |
| `created_at` | `timestamptz` | yes | Default `now()`. |

Current code path:

- `src/lib/authOptions.ts`
  - `signIn` callback upserts `{ email, name }` into `teachers`.
  - `session` callback looks up `teachers.id` by email and attaches it as `session.user.teacherId`.

### `students`

Expected columns based on current code:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Primary key. |
| `teacher_id` | `uuid` | yes | References `teachers.id`. |
| `name` | `text` | yes | Student display name. |
| `grade` | `text` | yes | Stored as current app form value. |
| `school` | `text` | no | Student school. |
| `target_dept` | `text` | no | Desired major/department. |
| `naesin_data` | `jsonb` | no | Grade data and Phase 2 university target picks. |
| `segibu_pdf_url` | `text` | no | Reserved for uploaded student record file URL. |
| `segibu_analysis` | `jsonb` | no | Service3 structured analysis. |
| `created_at` | `timestamptz` | yes | Default `now()`. |

Current code paths:

- `src/app/api/students/route.ts`
  - `GET`: returns only rows matching `teacher_id`.
  - `POST`: inserts the request body with the current `teacher_id`.
- `src/app/api/students/[id]/route.ts`
  - `PATCH`: updates by `id` and `teacher_id`.
  - `DELETE`: deletes by `id` and `teacher_id`.
- `src/contexts/StudentContext.tsx`
  - Persists Service3 analysis to `students.segibu_analysis`.
  - Restores the current student's analysis after reload.
  - Persists Phase 2 target picks to `students.naesin_data.university_picks`.
  - Persists Phase 4 Seteuk results through `students.naesin_data.seteuk_latest` and `seteuk_records`.
  - Persists Phase 5 roadmap snapshots through `students.naesin_data.roadmap_latest`.

### `students.naesin_data` Current JSON Shape

Phase 2 uses the existing JSONB column to avoid requiring an immediate production migration.

```json
{
  "service1": {
    "grade5": 2,
    "grade9": 3.267,
    "conversionVersion": "mixed",
    "conversionReason": "conversion note",
    "searchRange": 0.3,
    "showAmbitious": true,
    "updatedAt": "2026-04-28T00:00:00.000Z"
  },
  "university_picks": {
    "challenge": {},
    "fit": {},
    "safe": {}
  },
  "seteuk_latest": {},
  "seteuk_records": [],
  "roadmap_latest": {}
}
```

If a future phase introduces dedicated tables for target picks, Seteuk results, or roadmaps, this JSON shape is the migration source.

### `error_reports`

Expected columns based on current code:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Primary key. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `status` | `text` | yes | Initial value: `new`. |
| `reporter_teacher_id` | `uuid` | no | References `teachers.id`; null if teacher is removed. |
| `reporter_email` | `text` | no | Authenticated teacher email for follow-up. |
| `page_path` | `text` | no | App route where the report was submitted. |
| `service_label` | `text` | no | Browser title/service label. |
| `visible_error` | `text` | no | User-entered visible error, sanitized server-side. |
| `user_note` | `text` | no | User-entered reproduction note, sanitized server-side. |
| `user_agent` | `text` | no | Browser user agent. |
| `app_context` | `jsonb` | no | Sanitized app context only; no raw student records or files. |
| `client_context` | `jsonb` | no | Sanitized viewport/timezone/language data. |
| `server_context` | `jsonb` | no | Server receipt metadata. |
| `mail_status` | `text` | no | `pending`, `sent`, `skipped`, or `failed`. |
| `mail_error` | `text` | no | Sanitized notification failure text. |

Current code paths:

- `src/app/api/error-reports/route.ts`
  - Requires a signed-in teacher session.
  - Stores a sanitized report in Supabase.
  - Sends optional mail notification when `UNITHING_MAIL_WEBHOOK_URL` and `UNITHING_MAIL_TO` are configured.
- `src/app/api/admin/error-reports/route.ts`
  - Requires admin password session cookie.
  - Returns recent reports with an AI-developer copy block.
- `src/app/admin/page.tsx`
  - Password-protected admin UI for viewing and copying reports.

### `admin_sessions`

Expected columns based on current code:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Random session id; signed in the admin cookie. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `expires_at` | `timestamptz` | yes | Admin session expiry. |
| `revoked_at` | `timestamptz` | no | Set on admin logout. |
| `client_hint` | `text` | no | Short IP hint for incident review; not used as auth. |

Current code paths:

- `src/app/api/admin/login/route.ts`
  - Checks `UNITHING_ADMIN_PASSWORD`.
  - Creates a stateful admin session row and sets an HTTP-only cookie.
- `src/app/api/admin/logout/route.ts`
  - Revokes the current admin session row.
- `src/lib/adminAuth.ts`
  - Requires a dedicated `ADMIN_SESSION_SECRET`; it does not fall back to `NEXTAUTH_SECRET`.

## Checked-In Migration

Baseline SQL:

```text
supabase/migrations/20260428_unithing_operational_baseline.sql
supabase/migrations/20260513_unithing_error_reports.sql
```

This migration:

- creates `teachers` and `students`
- creates the `students_teacher_created_idx` index
- documents JSONB columns with comments
- enables RLS
- blocks direct anon access to `teachers` and `students`
- creates `error_reports`, its indexes, and enables RLS
- creates `admin_sessions`, its index, and enables RLS

Because the app uses NextAuth rather than Supabase Auth, production server routes should use `SUPABASE_SERVICE_ROLE_KEY` and enforce teacher isolation in route code.

## Recommended SQL Baseline

Use this as the migration/reference shape if the Supabase project needs to be recreated.

```sql
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null,
  grade text not null,
  school text,
  target_dept text,
  naesin_data jsonb,
  segibu_pdf_url text,
  segibu_analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists students_teacher_created_idx
  on public.students (teacher_id, created_at desc);
```

## RLS Reality Check

The current app does teacher isolation in server routes by filtering `teacher_id` from the NextAuth session.

That protects normal app access. Since NextAuth Google sessions are not automatically Supabase Auth users, RLS cannot identify the teacher unless a custom Supabase Auth mapping is deliberately added.

Phase 6 chooses the server-route model:

1. Browser calls Next.js API routes.
2. API routes read the NextAuth session and `teacherId`.
3. API routes use `supabaseServer`.
4. Query/update/delete operations still filter by `teacher_id`.
5. Direct anon access is blocked by RLS policies.

## Phase 6 Decision

For the current production hardening baseline:

- Keep route-level `teacher_id` filtering as the app-level protection.
- Use `SUPABASE_SERVICE_ROLE_KEY` in server routes when available.
- Keep the anon fallback only so local/dev environments do not break before the service-role key is configured.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code or `NEXT_PUBLIC_*`.

## Open Items Before Production Use

- Apply the checked-in migration to the production Supabase project or confirm the existing schema matches it.
- Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel production/preview environments.
- Confirm RLS is enabled on `teachers` and `students`.
- Confirm RLS is enabled on `error_reports`.
- Configure `UNITHING_ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and optional mail webhook variables in Vercel.
- `ADMIN_SESSION_SECRET` must be a separate random value and must not reuse `NEXTAUTH_SECRET`.
- Mail webhook variables are `UNITHING_MAIL_WEBHOOK_URL`, `UNITHING_MAIL_WEBHOOK_SECRET`, and `UNITHING_MAIL_TO`.
- Remove anon fallback after production service-role configuration is confirmed.
