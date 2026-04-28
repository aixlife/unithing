# Phase 0 Baseline

Updated: 2026-04-27

## Purpose

Phase 0 fixes the current UNITHING MVP as a stable baseline before expanding the original five services.

The product baseline is:

1. Teacher signs in with Google.
2. Teacher creates or selects a student.
3. Teacher analyzes a student record in Service3.
4. The integrated report inside Service3 reads the same analysis and shows the report.
5. Service1 searches universities from the current admissions JSON.
6. Service4 generates a Seteuk plan from student, major, subject, and interest context.

## Current Verification

| Check | Status | Note |
| --- | --- | --- |
| `npm run lint` | Pass | ESLint errors were fixed. |
| `npm run build` | Pass | Code builds; `turbopack.root` is pinned in `next.config.ts`. Sandboxed run can still fail on Turbopack port binding. |
| Local env keys | Present | Verified key names in `.env.local` without reading secret values. |
| Supabase usage | Documented | See `docs/supabase-schema-rls.md`. |
| University data baseline | Documented | See `docs/university-data-baseline.md`. |
| Vercel URL | Pass | `https://unithing.vercel.app` redirects `/` to `/login`. |
| Vercel Service1 API | Pass | `/api/universities?grade=5&limit=3` returns results. |
| Vercel students auth guard | Pass | `/api/students` returns `401` when not signed in. |
| Vercel Google signin | Pass | Manual production login confirmed by the user on 2026-04-27. |

## 2026-04-27 Deployment Check

Checked from the local machine with external network access:

```text
GET / -> 307 /login
GET /login -> 200
GET /api/auth/providers -> google provider is exposed
GET /api/auth/signin/google -> initial machine check returned /login?error=google
Manual browser login -> Pass
GET /api/universities?grade=5&limit=3 -> 200 with results
GET /api/students without session -> 401 Unauthorized
Vercel production env names -> all required keys are present
Vercel production deployment -> Ready, created 2026-04-24 16:09 KST
```

The production app is reachable, Google login works in the browser, and the protected student API rejects anonymous access. The machine-only signin check can still show `error=google` when it does not follow the same interactive browser flow, so the manual browser result is the authoritative OAuth smoke result.

## Required Environment Variables

Local and Vercel environments must provide:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_MODEL=
GEMINI_API_KEY=
AI_DAILY_LIMIT_SEGIBU=
AI_DAILY_LIMIT_SETEUK=
AI_DAILY_LIMIT_SUBJECTS=
```

For the Vercel production deployment, use:

```bash
NEXTAUTH_URL=https://unithing.vercel.app
```

Google Cloud Console must include the production OAuth callback:

```text
https://unithing.vercel.app/api/auth/callback/google
```

The localhost callback is only needed for local Google login testing:

```text
http://localhost:3000/api/auth/callback/google
```

## Production Smoke Test

Run this manually on the deployed Vercel URL after confirming the Google OAuth callback and Vercel env values:

1. Open `https://unithing.vercel.app`.
2. Sign in with Google.
3. Confirm a row is upserted or reused in `teachers`.
4. Create a sample student.
5. Confirm the student is visible only under the signed-in teacher.
6. Run Service3 with either a sample PDF or pasted student-record text.
7. Confirm `students.segibu_analysis` is updated.
8. Refresh the page and confirm the selected student's analysis is restored.
9. Open the `통합 리포트` tab inside Service3 and confirm the report uses the same analysis.
10. Run Service1 with a sample grade and confirm university results load.
11. Run Service4 through final generation with the same student context.

Phase 0 is complete as of 2026-04-27. Google login was manually confirmed, and the current docs match the deployed setup.

## Known Baseline Limits

- Kakao login is not wired as a provider.
- Service2 uses the original curated static data, not the full 2028 recommended-subject CSV.
- Service3 and the integrated report view use prompt-based guidebook philosophy, not PDF RAG.
- The integrated report is simplified compared with the full original export/cumulative-analysis app.
- Service1 currently includes only `교과` and `종합` admissions rows in `universitiesRaw.json`.
