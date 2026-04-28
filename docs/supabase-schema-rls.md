# Supabase Schema And RLS Baseline

Updated: 2026-04-28

## Current App Usage

The integrated app currently uses Supabase through `src/lib/supabase.ts` with the browser-safe anon key.

The code reads and writes these tables:

- `teachers`
- `students`

`students.segibu_analysis` stores the structured Service3 analysis used later by Service5.

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
  }
}
```

If Phase 6 introduces a dedicated table or column for target picks, this JSON shape is the migration source.

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

That protects normal app access, but it is not a complete database-level policy unless Supabase RLS is also configured. Because the current Supabase client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Phase 0 production hardening should confirm one of these two setups:

1. RLS policies exist and correctly restrict `students` by the signed-in database identity.
2. Server routes use a server-side Supabase key and keep the anon key away from privileged writes.

The current code is closer to option 1 in naming, but NextAuth Google sessions are not automatically Supabase Auth users. So do not assume RLS can identify the teacher unless that mapping has been deliberately configured in Supabase.

## Phase 0 Decision

For the current MVP baseline:

- Keep route-level `teacher_id` filtering as the app-level protection.
- Before broader use, add a server-only Supabase client using `SUPABASE_SERVICE_ROLE_KEY` for server route writes, or move auth fully onto Supabase Auth so RLS can enforce teacher separation.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code or `NEXT_PUBLIC_*`.

## Open Items Before Production Use

- Confirm actual Supabase table schema matches this document.
- Confirm whether RLS is enabled on `teachers` and `students`.
- Decide server-only service-role route client vs Supabase Auth RLS integration.
- Add a checked-in migration once the final policy is chosen.
