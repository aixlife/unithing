# Phase 5 Consulting Roadmap

Updated: 2026-04-28

## Goal

Phase 5 adds a single counseling roadmap screen that combines the outputs of the integrated services:

```text
student profile
-> student-record analysis
-> target university picks
-> target-based subject hints
-> saved Seteuk activity
-> next counseling checklist
```

## What Changed

- Added a new dashboard tab: `상담 로드맵`.
- Added `src/components/services/Service6Roadmap.tsx`.
- Added a roadmap snapshot type in `src/types/student.ts`.
- Added `students.naesin_data.roadmap_latest` as the saved roadmap snapshot shape.
- The roadmap screen shows:
  - analysis status and admissions-readiness summary
  - target university 3 Picks
  - recommended subject hints from the 2028 university subject API
  - latest saved Seteuk topic and follow-up activity
  - next counseling checklist
- Added quick navigation buttons back to the source services.
- Added roadmap save, Markdown counseling sheet download, and browser print output.

## Data Inputs

| Source | Field / API | Roadmap Usage |
| --- | --- | --- |
| Student profile | `currentStudent` | name, school, grade, target dept |
| Service3 | `students.segibu_analysis` | scores, readiness summary, weaknesses |
| Service1 | `students.naesin_data.university_picks` | challenge/fit/safe picks |
| Phase 3 data | `GET /api/recommended-subjects` | core/recommended subject hints |
| Service4 | `students.naesin_data.seteuk_latest` | topic, one-line feedback, follow-up activity |
| Phase5 | `students.naesin_data.roadmap_latest` | saved roadmap snapshot |

## Snapshot Shape

Roadmap snapshots are stored inside `students.naesin_data`:

```json
{
  "roadmap_latest": {
    "id": "uuid",
    "savedAt": "2026-04-28T00:00:00.000Z",
    "studentName": "학생명",
    "targetDept": "목표 학과",
    "analysisSummary": "현재 학생부 요약",
    "targetSummary": "목표 대학 3 Picks",
    "subjectSummary": "과목 선택안",
    "seteukSummary": "세특 활동안",
    "nextChecklist": ["다음 상담 때 확인할 항목"]
  }
}
```

## Roadmap Behavior

- The top status strip shows whether analysis, target picks, subject hints, and Seteuk activity are ready.
- Missing items are automatically converted into next counseling checklist items.
- If all main items are ready, the checklist shifts to execution checks:
  - 모집요강 변동 여부
  - 학교 개설 과목/선택군 충돌 여부
  - 세특 활동 실행 증거와 후속 일정
- The screen can save the current snapshot back to Supabase.
- Markdown download provides a portable counseling sheet.
- Browser print provides quick output without introducing a new PDF rendering dependency.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed using approved external execution because sandboxed Turbopack builds cannot bind a local process port.

## Deferred

- Phase 3 AI subject plans are still not persisted separately; the roadmap currently derives subject hints from the 2028 recommended-subject API.
- A polished PDF layout can be added later if Markdown/print is insufficient for field use.
- Multi-roadmap history is deferred; only the latest snapshot is stored.
