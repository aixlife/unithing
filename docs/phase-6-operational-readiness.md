# Phase 6 Operational Readiness

Updated: 2026-04-28

## Goal

Phase 6 prepares UNITHING for safer public operation by tightening server-side data access, protecting AI routes, adding a reproducible Supabase baseline, and documenting privacy/launch checks.

## What Changed

- Added `src/lib/supabaseServer.ts`.
  - Uses `SUPABASE_SERVICE_ROLE_KEY` when configured.
  - Falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` for local/dev continuity.
- Switched server-side teacher/student access to `supabaseServer`.
- Added `src/lib/aiUsage.ts` for per-teacher soft daily AI quotas.
- Added session + teacher-id guards to AI endpoints:
  - `POST /api/analyze/segibu`
  - `GET /api/analyze/seteuk`
  - `POST /api/analyze/seteuk`
  - `POST /api/recommend/subjects`
- Added teacher-id checks in student APIs when the session callback cannot resolve a teacher.
- Added a dashboard privacy reminder for student-record handling.
- Added a checked-in Supabase baseline migration.
- Updated Supabase/RLS documentation.
- Added privacy and data-handling documentation.

## Environment Variables

Required for production:

```text
NEXTAUTH_URL=https://unithing.vercel.app
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Optional operating limits:

```text
AI_DAILY_LIMIT_SEGIBU=30
AI_DAILY_LIMIT_SETEUK=120
AI_DAILY_LIMIT_SUBJECTS=120
GEMINI_MODEL=gemini-2.5-flash
```

## Supabase Baseline

Migration:

```text
supabase/migrations/20260428_unithing_operational_baseline.sql
```

This creates:

- `teachers`
- `students`
- `students_teacher_created_idx`
- RLS enabled on both tables
- policies blocking direct anon table access

Because the app uses NextAuth instead of Supabase Auth, production server routes should use the service-role key and enforce `teacher_id` filtering in application code.

## AI Quota Behavior

The current quota is intentionally lightweight:

- keyed by KST day, teacher id, and AI scope
- enforced in server memory
- enough to prevent accidental repeated calls in the common case
- not a billing-grade rate limiter

Move quota storage to Supabase before a larger public launch if strict enforcement is required.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed using approved external execution because sandboxed Turbopack builds cannot bind a local process port.

## Remaining Production Checks

- Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.
- Apply or compare the Supabase migration against production.
- Test unauthenticated requests to student and AI routes return 401.
- Confirm the new AI limits fit the intended free launch usage.
- Decide whether to connect Kakao login or hide the current Kakao button before public use.
- Decide whether the book/ad/sidebar operating content is part of launch scope.
