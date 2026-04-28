# University Data Baseline

Updated: 2026-04-28

## Current Source And Output

Source material:

```text
/Users/aixlife/Projects/Campus Mento/service_source/9등급 변환기_2025 어디가 입결.csv
```

Current integrated JSON:

```text
/Users/aixlife/Projects/Campus Mento/UNITHING/src/data/universitiesRaw.json
```

Checked conversion script:

```text
/Users/aixlife/Projects/Campus Mento/UNITHING/scripts/build-universities-data.mjs
```

Current JSON row count:

```text
16,582
```

Current JSON admission-type counts:

```text
교과: 10,474
종합: 6,108
```

Current JSON grade range:

```text
1.0 through 9.0
```

## Current Filter Policy

The current integrated data intentionally keeps only admissions rows that fit the Service1 MVP:

- Include `교과`
- Include `종합`
- Exclude mostly `실기`
- Exclude mostly `논술`
- Exclude grade values outside the valid 1 to 9 range

Earlier audit found:

- Source valid data rows: 16,867
- Current JSON rows: 16,582
- Difference: 285
- `npm run data:universities -- --check` currently reports `실기` 201 rows, `논술` 80 rows, and 4 invalid grade rows.

This is acceptable for the current counseling MVP, but it must stay explicit because users may otherwise assume every admissions type is included.

## API Behavior

The current API is:

```text
GET /api/universities?grade=5.2&range=2.0&limit=200
```

Parameters:

| Name | Meaning | Default/Limit |
| --- | --- | --- |
| `grade` | User's converted 9-grade scale value | Required, 1 to 9 |
| `range` | Allowed grade difference from admissions result | Default `2.0`, max `4.0` |
| `limit` | Max returned rows | Default `200`, max `500` |

The API balances results into:

- `도전`
- `적정`
- `안정`

Then adds an inferred department category such as `의약`, `공학`, `자연`, `사회`, `인문`, `교육`, or `기타`.

## Phase 2 Follow-Up

Phase 2 added the main durable pieces:

- Checked-in conversion script from the source CSV to `universitiesRaw.json`.
- Explicit include/exclude option via `--include=교과,종합`.
- Student-specific target college picks: `도전`, `적정`, `안정`.
- Saved target picks under `students.naesin_data.university_picks` for Phase 3 subject planning and Phase 4 Seteuk planning.

Run:

```bash
npm run data:universities -- --check
```
