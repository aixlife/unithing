# Phase 2 University Targets

Updated: 2026-04-28

## Goal

Phase 2 turns Service1 from a one-time university search into a saved counseling target flow:

```text
5-grade input
-> 9-grade conversion
-> admissions search
-> challenge/fit/safe target picks
-> subject planning and seteuk planning
```

## What Changed

- Added student-specific `도전`, `적정`, `안정` target picks in Service1.
- Saved picks under `students.naesin_data.university_picks` instead of adding a new production DB column.
- Saved the latest Service1 conversion snapshot under `students.naesin_data.service1`.
- Updated `students.target_dept` when a university pick is saved, so downstream services can use the selected department immediately.
- Added a reusable `updateStudent` method in `StudentContext`.
- Tightened student create/update API routes to accept only known student fields.
- Added Service1 action buttons that jump to Service2 과목 가이드 and Service4 세특 도우미.
- Added Service2 prefill from the current student's target department or primary university pick.
- Added a checked-in admissions conversion script:

```text
scripts/build-universities-data.mjs
```

## Stored Shape

Service1 writes to the existing `naesin_data` JSONB column:

```json
{
  "service1": {
    "grade5": 2,
    "grade9": 3.267,
    "conversionVersion": "mixed",
    "conversionReason": "경기/부산/광주 평균...",
    "searchRange": 0.3,
    "showAmbitious": true,
    "updatedAt": "2026-04-28T00:00:00.000Z"
  },
  "university_picks": {
    "challenge": {
      "slot": "challenge",
      "slotLabel": "도전",
      "name": "대학교명",
      "dept": "모집단위",
      "process": "전형명",
      "type": "교과",
      "category": "공학",
      "grade": 2.9,
      "badge": "도전",
      "currentGrade9": 3.267,
      "gradeGap": -0.367,
      "source": "service1-2025-admissions",
      "savedAt": "2026-04-28T00:00:00.000Z"
    }
  }
}
```

Primary downstream target priority is:

```text
적정 -> 도전 -> 안정
```

## Admissions Data Policy

The current MVP continues to include only:

- `교과`
- `종합`

The current MVP excludes:

- `논술`
- `실기`
- grade values outside `1-9`

The checked script reproduces the current `src/data/universitiesRaw.json` exactly.

Verification command:

```bash
npm run data:universities -- --check
```

Observed result on 2026-04-28:

```text
sourceRows: 16,867
included: 16,582
excludedByType: 실기 201, 논술 80
invalidGrade: 4
same: true
```

## Verification

- `npm run data:universities -- --check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. The first sandboxed build hit a Turbopack permission panic while binding an internal process; rerunning with build permission passed.

## Deferred

- Formal Supabase migration for a dedicated `target_university_picks` column remains deferred to Phase 6.
- Student grade prefill from saved 내신 records remains deferred until the app has a fuller grade-entry model.
- Full target-college gap scoring beyond grade gap is deferred until Phase 5 roadmap, where Service3 analysis, Service2 subjects, and Service4 seteuk outputs can be scored together.
