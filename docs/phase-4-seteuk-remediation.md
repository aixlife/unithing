# Phase 4 Seteuk Remediation

Updated: 2026-04-28

## Goal

Phase 4 turns Service4 from a standalone Seteuk generator into a student-record remediation tool:

```text
Service3 weakness analysis
-> Phase 2 target university/dept
-> Phase 3 recommended subject hints
-> Service4 Seteuk activity and draft
-> student-specific saved Seteuk record
```

## What Changed

- Added student-level Seteuk result types in `src/types/student.ts`.
- Added `students.naesin_data.seteuk_records` and `students.naesin_data.seteuk_latest` as the storage shape.
- Added a Service4 context panel that shows:
  - target university/dept inherited from Service1 picks
  - recommended-subject hints from the 2028 university subject API
  - Seteuk remediation candidates derived from Service3 `criticalWeaknesses`
  - recently saved Seteuk results for the current student
- Changed Service4 local draft storage from global keys to per-student localStorage keys.
- Saved the final generated Seteuk draft and plan back to Supabase through the existing student PATCH flow.
- Expanded `/api/analyze/seteuk` prompts so final generation receives:
  - existing activity/remediation context
  - target university
  - target dept
  - student-record weaknesses
  - recommended-subject hints

## Source Material Applied

Reference files:

```text
/Users/aixlife/Projects/Campus Mento/service_source/학생부 분석 및 세특/GPT 세특.txt
/Users/aixlife/Projects/Campus Mento/service_source/학생부 분석 및 세특/1._교사의_세특_작성요령.txt
/Users/aixlife/Projects/Campus Mento/service_source/학생부 분석 및 세특/3._입학사정관의_세특평가.txt
/Users/aixlife/Projects/Campus Mento/service_source/학생부 분석 및 세특/0. 세특 역량.pdf
/Users/aixlife/Projects/Campus Mento/service_source/학생부 분석 및 세특/4_학생부 쓸때 좋은 말.pdf
```

Applied rules:

- Start from the student's own question or curiosity.
- Prefer concrete, observable actions over generic praise.
- Show self-directed learning attitude, growth process, and major fit.
- Convert weaknesses into evidence-making activities, not direct deficit labels.
- Use teacher-observation voice and noun-ending style.
- Keep forbidden platform names normalized.
- Treat recommended subjects as curriculum evidence, not direct marketing copy for a university.

## Data Shape

Seteuk records are stored inside `students.naesin_data`:

```json
{
  "seteuk_latest": {
    "id": "uuid",
    "savedAt": "2026-04-28T00:00:00.000Z",
    "major": "컴퓨터공학과",
    "interest": "생기부 약점과 보완 방향",
    "activities": "목표 대학/학과, 연계 과목, 보완 근거",
    "selectedTopic": "탐구 주제",
    "selectedMotivation": "탐구 동기",
    "selectedCompetencies": ["역량: 행동 근거"],
    "selectedFollowUp": "후속 활동",
    "draft": "교사 관점 세특 초안",
    "plan": { "plan": [] },
    "oneLineFeedback": "학생 상담용 피드백",
    "context": {
      "targetUniversity": "목표 대학",
      "targetDept": "목표 모집단위",
      "weaknesses": ["보완점: 처방"],
      "subjectHints": ["권장과목"]
    }
  },
  "seteuk_records": []
}
```

The record list keeps the latest 5 generated results.

## Service4 Behavior

- If a student has Service3 analysis, the top panel creates up to 3 remediation candidates from `criticalWeaknesses`.
- If no weakness exists but a target university/dept or subject hint exists, Service4 shows a target-based candidate.
- Applying a candidate fills the interest and activities fields and clears stale generated outputs.
- Final generation automatically saves the result to the selected student.
- Saved results can be reopened from the Service4 start screen.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed after rerun outside sandbox.

The first sandboxed build failed because Turbopack could not bind a local process port under sandbox restrictions. The same command passed when rerun with approved external execution.

## Deferred

- A fully structured RAG/reference-snippet store for all Seteuk PDFs is still deferred.
- Saving Phase 3 subject plans remains deferred until Phase 5 integrated roadmap.
- A teacher-edit history or version comparison view is deferred.
