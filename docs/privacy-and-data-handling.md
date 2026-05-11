# Privacy And Data Handling

Updated: 2026-05-12

## Data Stored

UNITHING stores the following student counseling data in Supabase:

- student label or alias, grade, optional school, target department
- target university picks
- sanitized student-record counseling summary
- Seteuk drafts and plans
- counseling roadmap snapshots

Student-record AI analysis is split into two layers:

- Session layer: the browser can show the fresh full analysis immediately after a teacher runs it.
- Stored layer: Supabase stores only counseling summaries, scores, next actions, and sanitized recommendations. Raw student-record text, direct quotes, structured raw extraction, student name, and school identifier from the AI response are removed before saving.

## Handling Rules

- Register students with a number, alias, or initials whenever possible.
- Upload or paste real student records only when they are needed for counseling.
- Before AI analysis, remove or mask direct identifiers such as student real name, resident registration number, address, phone number, parent information, school/output metadata, and unrelated private notes.
- Do not share raw transcripts, raw student records, private file paths, or identifiers with external AI Council participants. Use sanitized minimum context only.
- Before sharing exported Markdown, printed roadmaps, or PDFs, check student-identifying details again.
- Treat AI output as counseling assistance, not a final admission judgment.
- Re-run or manually review output when source documents are incomplete or OCR/PDF extraction quality is low.

## App-Side Controls

- Dashboard shows a privacy reminder before service tabs.
- Student registration asks for a student label rather than a real name.
- Student-record upload happens in the analysis tab after de-identification review, not during student registration.
- The PDF upload flow creates a redacted image-only PDF preview for the current supported sample format and requires teacher confirmation before AI analysis.
- The redaction flow combines fixed high-risk zones, text-coordinate matching for high-confidence school/institution/name candidates, and teacher-entered extra identifiers.
- Automatic redaction intentionally avoids broad keywords so non-identifying subjects and activity evidence remain available for counseling.
- Text paste mode also requires direct-identifier removal confirmation.
- Dashboard access is protected by NextAuth.
- Student API routes require a valid session and teacher id.
- AI routes require a valid session and teacher id.
- Student-record and curriculum PDF AI routes reject missing files, non-PDF files, or files over 20MB before quota/model calls.
- Server routes use `SUPABASE_SERVICE_ROLE_KEY` when configured and still filter by `teacher_id`.
- A soft per-teacher daily AI quota is applied in server memory:
  - `AI_DAILY_LIMIT_SEGIBU` default: 30
  - `AI_DAILY_LIMIT_SETEUK` default: 120
  - `AI_DAILY_LIMIT_SUBJECTS` default: 120

## Known Limits

- The current AI quota is an in-memory soft guard. It can reset when a serverless instance restarts or traffic moves to another instance.
- For strict production metering, move AI usage accounting to a Supabase table or managed rate-limit store.
- RLS blocks direct anon table access in the baseline migration, but the production app depends on server routes enforcing `teacher_id` isolation.
- The current automatic PDF redaction is format-specific. Teachers must review the full preview and re-upload a manually corrected PDF if remaining identifiers are visible.
- A fresh AI response may contain richer analysis in the browser session. The stored copy is sanitized before persistence.

## Production Checklist

- Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel production and preview environments.
- Apply `supabase/migrations/20260428_unithing_operational_baseline.sql`.
- Confirm direct anon access to `teachers` and `students` is blocked.
- Confirm dashboard, student APIs, and AI APIs return 401 when not signed in.
- Set AI daily limits to values suitable for the free public launch.
- Run only bounded paid verification calls and record the exact count.
