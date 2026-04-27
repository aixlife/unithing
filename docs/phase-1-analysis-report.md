# Phase 1 Analysis And Report Baseline

Updated: 2026-04-27

## Purpose

Phase 1 connects Service3 and Service5 as one student-record analysis flow.

The intended counseling flow is:

```text
Service3 생기부 분석
-> structured analysis saved to students.segibu_analysis
-> Service5 reads the same analysis
-> teacher sees current level, evidence, weaknesses, next actions
```

## Source Alignment

Integrated source apps:

- `service/생기부-분석-ai-리포트_ver-최종-완성2`
- `service/학생부-분석-ai-(school-record-analysis-ai)`
- `service/학생부-분석-ai-(school-record-analysis-ai)_비판적-관점`

Integrated source materials:

- `service_source/학생부종합전형 체크리스트.pdf`
- `service_source/생기부 분석.pdf`
- `service_source/숭신고 생기부.pdf`
- 2026 major university student-record guidebooks in `service_source`

Current implementation uses the guidebook philosophy and checklist criteria in the prompt. It does not yet use RAG or per-page source citation from PDFs.

## Current Schema

The main analysis type is `SegibuAnalysis` in `src/types/analysis.ts`.

Core fields:

- `report`: markdown 심층 분석 리포트
- `scores`: 학업/진로/공동체 역량 점수
- `grades`: 교과별 학기 성적 매트릭스
- `groupAverages`: 전과목, 국영수사과, 국영수사, 국영수과 평균
- `summaryHighlights`: 3대 역량별 핵심 요약
- `futureStrategy`: 심화 탐구 및 연계 과목 제안
- `highlights`: 창체/교과/행특의 역량 하이라이트
- `structuredData`: 창체/교과/행특 원문 구조화
- `admissionsReadiness`: 상담 처방 데이터

## New Counseling Data

Phase 1 adds `admissionsReadiness`:

```ts
{
  overall: string;
  criticalWeaknesses: Array<{
    competency: 'academic' | 'career' | 'community';
    issue: string;
    evidence: string;
    recommendation: string;
  }>;
  nextActions: Array<{
    priority: 1 | 2 | 3 | 4 | 5;
    action: string;
    linkedService: 'university' | 'subject' | 'seteuk' | 'report';
    reason: string;
  }>;
  reliability: {
    confidence: 'high' | 'medium' | 'low';
    missingData: string[];
    notes: string;
  };
}
```

This is the bridge from Phase 1 to later phases:

- `university` -> Phase 2 대학 찾기/목표 대학 선택
- `subject` -> Phase 3 과목 설계
- `seteuk` -> Phase 4 세특 보완
- `report` -> Phase 5 통합 상담 로드맵

## Prompt Criteria

The Service3 API prompt now explicitly applies the checklist structure:

- 학업역량
  - 학업 성취도
  - 학업 태도
  - 탐구력
- 진로역량
  - 전공 관련 교과 이수노력
  - 전공 관련 교과 성취도
  - 진로 탐색 활동과 경험
- 공동체역량
  - 협업과 소통
  - 나눔과 배려
  - 성실성과 규칙준수
  - 리더십

The prompt also asks the model to produce:

- concrete evidence from the student record
- critical weaknesses
- practical recommendations
- next UNITHING service action
- analysis reliability
- calibrated scores around the low 80s unless truly exceptional evidence exists

The API additionally applies a deterministic score calibration step:

- Individual competency scores are capped at `88` by default.
- If the three-score average exceeds `82`, scores are adjusted downward while preserving relative strength.
- This implements the source feedback that scores should not be too generous and should usually average near `80`.

## Error Handling

The Service3 API now parses AI output more defensively:

- Accepts fenced `json` blocks.
- Falls back to first `{ ... }` JSON span if fencing is missing.
- Removes the JSON block from the markdown report.
- If parsing fails, asks the model to repair the output format without reanalyzing the PDF.
- Normalizes missing `admissionsReadiness` data into a safe default.

## UI Behavior

Service3:

- Continues to show the detailed markdown report, score cards, grade matrix, and activity tabs.
- Shows `admissionsReadiness` as a “상담 처방 요약” card when available.

Service5:

- Continues to read the same `students.segibu_analysis` data.
- Shows the same counseling prescription in the overview tab.
- Includes all structured record text, strategy text, and weakness/recommendation text in the keyword cloud input.
- Keeps PDF export.
- Restores Markdown export for 상담 공유/보관.

Deferred from the original apps:

- Excel export
- D3 word cloud
- cumulative multi-student analysis

## Remaining Phase 1 Checks

- Test the prompt against `service_source/숭신고 생기부.pdf`.
  - 2026-04-27 local test reached the API but failed because the local `GEMINI_API_KEY` is invalid.
  - `npm run dev -- --webpack` should be used for the local API test because Turbopack dev can panic while rendering Korean code frames.
  - The dedicated UNITHING key stored as `UNUNTHING` in the local Keychain works when injected as `GEMINI_API_KEY`.
  - Synthetic student-record text test passed with status `200`; `admissionsReadiness` was generated with `overall`, `criticalWeaknesses`, `nextActions`, and `reliability`.
  - `숭신고 생기부.pdf` is confirmed dummy data by the user and passed with status `200`.
  - Calibrated PDF scores: academic `84`, career `86`, community `77`, average `82.3`.
- Confirm `admissionsReadiness` is saved and restored from Supabase.
  - The field is part of `SegibuAnalysis`, so it uses the existing `students.segibu_analysis` save/restore path.
  - Browser-level authenticated save/restore was not separately re-run in this phase.
- Decide whether to restore Excel export from the original student-record apps.
- Decide whether D3 word cloud is worth restoring or the current lightweight keyword cloud is enough.
- Decide whether Phase 1 needs a reference-snippet/RAG layer before broader demos.

## Verification

Latest local code verification:

- `npm run lint`: pass
- `npm run build`: pass
- `POST /api/analyze/segibu` with synthetic student-record text: pass
- `POST /api/analyze/segibu` with `숭신고 생기부.pdf`: pass
