# University Data Baseline

Updated: 2026-04-27

## Current Source And Output

Source material:

```text
/Users/aixlife/Projects/Campus Mento/service_source/9등급 변환기_2025 어디가 입결.csv
```

Current integrated JSON:

```text
/Users/aixlife/Projects/Campus Mento/UNITHING/src/data/universitiesRaw.json
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
- Difference is mainly `실기` 202 rows, `논술` 80 rows, and 3 invalid grade outliers.

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

Phase 2 should add the missing durable pieces:

- Checked-in conversion script from the source CSV to `universitiesRaw.json`.
- Explicit include/exclude options for `교과`, `종합`, `논술`, and `실기`.
- A visible data-source note in the UI.
- Student-specific target college picks: `도전`, `적정`, `안정`.
- Saved target picks that can feed Phase 3 subject planning and Phase 4 Seteuk planning.

