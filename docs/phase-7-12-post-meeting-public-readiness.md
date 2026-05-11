# Phase 7-12 Post-Meeting Public Readiness

Updated: 2026-05-12

## Basis

This phase set reflects the 2026-05-06 feedback meeting and the follow-up AI Council review.

AI Council was used only as an external decision aid. The prompt contained sanitized product context only: no raw transcript, no file paths, no student record content, no names, no school identifiers, no secrets.

Current source constraint: there is one representative school curriculum table PDF. Use that single format first instead of pretending broader format coverage exists.

## Phase 7 — Privacy-First Data Split

**Purpose:** Separate session-only AI analysis from data that may be stored.

**Scope**

- Keep raw student-record text, AI direct quotes, and structured raw extraction out of persisted student records.
- Store only counseling summaries, scores, target values, next actions, and sanitized recommendations.
- Keep full analysis available only in the current browser session after a fresh analysis.

**Deliverable**

- `sanitizeSegibuAnalysisForStorage`
- saved `segibu_analysis` without raw `structuredData`, direct evidence, student name, or school identifier from the AI response
- report/export surfaces that use counseling summaries instead of raw AI report text

**Verification**

- Inspect saved payload shape after analysis.
- Confirm `structuredData` is empty in the stored version.
- Confirm report/export screens do not render raw student-record blocks.

## Phase 8 — Student Identity Minimization

**Purpose:** Reduce accidental collection of direct identifiers before any AI step.

**Scope**

- Treat the student name field as a student label.
- Encourage number, initials, or alias instead of real name.
- Move student-record upload out of the student registration modal.

**Deliverable**

- Student modal label and placeholder changed to alias-oriented wording.
- Dashboard privacy reminder explains that raw student records are used only after de-identification.

**Verification**

- Student can be registered with alias/number only.
- No student-record PDF upload appears during initial student registration.

## Phase 9 — Student-Record PDF De-Identification Gate

**Purpose:** Prevent obvious direct identifiers from being sent to AI without teacher review.

**Scope**

- Create a redacted preview file in the browser before analysis.
- Do not upload the PDF file in the default flow. Extract de-identified text in the browser and send only that text to the analysis API.
- Mask the first-page personal/academic-info/photo area and all-page footer/output area as fixed high-risk zones.
- Run a second text-coordinate pass after fixed-zone detection: detect high-confidence school/institution names and fixed-zone name candidates, then mask matching text boxes across all pages.
- Let the teacher add extra names, school abbreviations, teacher names, or institution names for full-document masking.
- Avoid broad keyword masking. Subject names, activity descriptions, and ordinary counseling evidence should not be hidden unless they match a high-confidence identifier or an explicit teacher-added term.
- Require teacher confirmation before analysis.
- Require explicit confirmation for text paste mode.
- Server rejects missing confirmation and oversized text/PDF payloads before quota is consumed. The default browser flow avoids Vercel's 4.5MB function payload limit by not sending the PDF file.

**Deliverable**

- Redacted local PDF preview and de-identified text extraction in the `생기부 분석` upload flow.
- `privacyConfirmed` gate in `/api/analyze/segibu`.
- Raw record and AI source text panels replaced by privacy lock panels.

**Verification**

- Local visual render check:
  - first page personal table/photo block is masked while the title remains
  - all-page footer/output area is masked
  - second-pass school/institution/name candidates are masked by text coordinate
  - analysis request sends de-identified text, not the PDF file
  - subject names, activity contents, and other non-identifying counseling evidence remain visible
- Paid Gemini validation is pending. When run, limit it to one student-record readability check and record the result without exposing student content.

## Phase 10 — Curriculum PDF Extraction, One Format First

**Purpose:** Restore the useful curriculum-table import flow without over-claiming coverage.

**Scope**

- Use the single available representative curriculum table PDF as the supported format.
- Extract only subject names, grade, semester, credits, select count, mandatory subjects, and reviewer notes.
- Require manual teacher review before applying the extracted values.

**Deliverable**

- `POST /api/parse/curriculum-pdf`
- `교육과정 편제표 PDF 불러오기` panel in the custom school curriculum modal
- parsed values filled into editable fields, not applied silently

**Verification**

- Paid Gemini validation is pending. When run, limit it to one curriculum extraction call and record the result shape.
- Result shape returned mandatory subjects, choice groups, subject count, and reviewer notes.
- Teacher-facing UI instructs manual review of subject names, credits, and select counts.

## Phase 11 — Public-Launch Teacher UX Guardrails

**Purpose:** Make risky operations explicit and keep the counseling workflow understandable.

**Scope**

- Show privacy reminders before sensitive flows.
- Show that AI analysis/extraction consumes a Gemini call.
- Keep AI output framed as counseling support, not final admission judgment.
- Keep launch copy focused on teacher workflow instead of technical internals.

**Deliverable**

- Dashboard privacy reminder.
- Upload/extraction cost-use copy.
- Locked raw-data panels and counseling-summary-first report.

**Verification**

- Teacher can identify when an AI call will happen.
- Teacher must actively confirm de-identification before the student-record AI call.

## Phase 12 — Cost, Quota, And Release Gate

**Purpose:** Allow real validation while preventing uncontrolled paid API usage.

**Scope**

- Use real paid calls for final verification only when explicitly approved.
- Do not retry paid calls automatically.
- Validate input locally before quota and model calls.
- Keep soft per-teacher daily quota in place.
- Before production public launch, decide whether in-memory quota is enough or whether durable Supabase/server-side accounting is required.

**Deliverable**

- Server-side type/size validation before paid calls.
- Existing AI daily limits remain active:
  - `AI_DAILY_LIMIT_SEGIBU`
  - `AI_DAILY_LIMIT_SETEUK`
  - `AI_DAILY_LIMIT_SUBJECTS`
- Test report includes exact paid call count.

**Verification**

- `npm run lint`
- `npm run build`
- bounded paid verification count reported in release notes

## Current Recommendation

Ship the privacy/storage split and one-format curriculum import first. Do not expand curriculum parsing to unknown school formats until the first public feedback round identifies the most common table variants.
