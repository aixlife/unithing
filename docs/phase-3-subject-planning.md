# Phase 3 Subject Planning

Updated: 2026-04-28

## Goal

Phase 3 upgrades Service2 from a curated static major guide into a target-college subject planning tool:

```text
Phase 2 target pick
-> 2028 university subject requirements
-> selected major guide
-> 2nd/3rd grade subject plan
```

## What Changed

- Added a CP949 CSV conversion script for the full 2028 university recommended-subject source.
- Added `src/data/recommendedSubjectsRaw.json`.
- Added `GET /api/recommended-subjects` for university/major search.
- Added `POST /api/recommend/subjects` for target-based 2nd/3rd grade subject planning.
- Connected Service2 to the Phase 2 primary target pick.
- Added a Service2 panel for the full CSV data, separate from the existing curated UI tips.
- Added AI subject planning with a rule-based fallback when Gemini is unavailable or returns invalid JSON.

## Source Data

Source:

```text
/Users/aixlife/Projects/Campus Mento/service_source/고교학점제_2028학년도 권역별 대학별 권장과목.csv
```

Generated:

```text
/Users/aixlife/Projects/Campus Mento/UNITHING/src/data/recommendedSubjectsRaw.json
```

Script:

```text
/Users/aixlife/Projects/Campus Mento/UNITHING/scripts/build-recommended-subjects-data.mjs
```

Verification:

```bash
npm run data:subjects -- --check
```

Observed result on 2026-04-28:

```text
sourceRows: 1,362 parsed CSV rows
dataRows: 1,358
universities: 47
withCoreSubjects: 1,180
withRecommendedSubjects: 383
```

The physical file has more terminal lines because some CSV cells contain line breaks. The parser count above is the actual CSV row count.

## Data Shape

Each generated row stores:

```json
{
  "region": "수도권",
  "location": "서울",
  "university": "고려대",
  "college": "공과대학",
  "major": "기계공학부",
  "unit": "공과대학 기계공학부",
  "core": "-",
  "recommended": "미적분Ⅱ, 역학과 에너지, 전자기와 양자",
  "coreSubjects": [],
  "recommendedSubjects": ["미적분Ⅱ", "역학과 에너지", "전자기와 양자"],
  "note": ""
}
```

Rows where the source gives a broad sentence instead of comma-separated subjects keep the sentence in `core` or `recommended`, but the subject array stays empty.

## API

### `GET /api/recommended-subjects`

Parameters:

| Name | Meaning |
| --- | --- |
| `university` | University keyword |
| `major` | Major/unit keyword |
| `q` | Broad keyword search |
| `limit` | Max results, capped at 100 |

The API ranks exact university/major matches first, then contains matches, then rows with more concrete subject arrays.

### `POST /api/recommend/subjects`

Input:

- target university and major
- selected Service2 curated major
- current curated recommended subjects
- matched university CSV rows
- optional student-record weakness notes

Output:

- summary
- 2nd grade subject plan
- 3rd grade subject plan
- cautions
- evidence

When `GEMINI_API_KEY` exists, the route asks Gemini for a structured JSON plan. If the key is missing or the model response fails, it returns a deterministic rule-based plan from the same source data.

## Service2 Behavior

- The Phase 2 primary pick priority is still `적정 -> 도전 -> 안정`.
- Service2 pre-fills from `students.target_dept` or the primary university pick.
- The new right-side panel searches the full 2028 CSV using the selected target university and major.
- The existing curated data remains useful for subject descriptions, school selection groups, and PDF output.
- The new full CSV data is the authoritative source for university-specific recommendations.

## Verification

- `npm run data:subjects -- --check`: passed.
- `npm run data:universities -- --check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## Deferred

- Remix version PDF parsing for a school's uploaded curriculum remains deferred.
- Saving the generated subject plan to Supabase is deferred to Phase 5, where it becomes part of the integrated roadmap.
- A deeper gap score between completed courses and recommended courses is deferred until real student course-history data exists.
