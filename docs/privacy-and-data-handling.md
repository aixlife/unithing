# Privacy And Data Handling

Updated: 2026-04-28

## Data Stored

UNITHING stores the following student counseling data in Supabase:

- student name, grade, school, target department
- target university picks
- student-record PDF URL if uploaded later
- structured student-record analysis
- Seteuk drafts and plans
- counseling roadmap snapshots

## Handling Rules

- Upload real student records only when they are needed for counseling.
- Avoid uploading unnecessary resident registration numbers, addresses, phone numbers, parent information, or unrelated private notes.
- Before sharing exported Markdown, printed roadmaps, or PDFs, check student-identifying details again.
- Treat AI output as counseling assistance, not a final admission judgment.
- Re-run or manually review output when source documents are incomplete or OCR/PDF extraction quality is low.

## App-Side Controls

- Dashboard shows a privacy reminder before service tabs.
- Dashboard access is protected by NextAuth.
- Student API routes require a valid session and teacher id.
- AI routes require a valid session and teacher id.
- Server routes use `SUPABASE_SERVICE_ROLE_KEY` when configured and still filter by `teacher_id`.
- A soft per-teacher daily AI quota is applied in server memory:
  - `AI_DAILY_LIMIT_SEGIBU` default: 30
  - `AI_DAILY_LIMIT_SETEUK` default: 120
  - `AI_DAILY_LIMIT_SUBJECTS` default: 120

## Known Limits

- The current AI quota is an in-memory soft guard. It can reset when a serverless instance restarts or traffic moves to another instance.
- For strict production metering, move AI usage accounting to a Supabase table or managed rate-limit store.
- RLS blocks direct anon table access in the baseline migration, but the production app depends on server routes enforcing `teacher_id` isolation.

## Production Checklist

- Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel production and preview environments.
- Apply `supabase/migrations/20260428_unithing_operational_baseline.sql`.
- Confirm direct anon access to `teachers` and `students` is blocked.
- Confirm dashboard, student APIs, and AI APIs return 401 when not signed in.
- Set AI daily limits to values suitable for the free public launch.
