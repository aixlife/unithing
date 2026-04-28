---
name: UNITHING Phase Execution Plan
description: 원본 5개 서비스 통합 완료를 위한 실행 순서와 검수 기준
type: project
updated: 2026-04-28
---

# UNITHING Phase Execution Plan

## 기준

이 문서는 **김강석 선생님 원본 서비스 5개를 UNITHING 상담형 제품으로 통합하는 실행 순서**다.

현재 목표는 원본 앱을 그대로 붙이는 것이 아니라, 선생님이 한 학생을 선택한 뒤 다음 흐름으로 상담할 수 있게 만드는 것이다.

```
생기부 분석
→ 현재 수준/강약점 파악
→ 대학 찾기 및 목표 대학 선택
→ 목표 대학·학과 기준 과목 설계
→ 부족한 역량을 보완하는 세특 활동 설계
→ 학생별 상담 로드맵 저장/출력
```

## 현재 상태 요약

### 완료된 기반

- Next.js 16 App Router 통합 앱
- Vercel 배포 파이프라인
- Google OAuth + NextAuth
- Supabase teachers/students 기반 학생 관리
- 학생 선택/등록/삭제
- 생기부 분석 결과를 `students.segibu_analysis`에 저장하고 새로고침 후 복원
- Service3 생기부 분석 API 연동
- Service4 세특 도우미 API 연동
- Service1 대학 찾기 API와 입결 JSON 연결
- Service2 원본 정적 데이터 3종 정확히 이식
  - `curriculumData.ts`
  - `universityData.ts`
  - `subjectDetails.ts`
- Service2 전체 2028 대학별 권장과목 CSV 검색/AI 과목 설계 연결
- Service1 목표 대학 → Service2 과목 설계 → Service4 세특 보완 후보 흐름 연결
- Service4 최종 세특 결과를 학생별 `naesin_data`에 저장하고 복원
- `상담 로드맵` 탭에서 분석/목표대학/과목/세특 결과를 하나로 묶어 저장·출력
- Service5는 Service3 분석 결과를 재사용하는 리포트 화면으로 통합
- `npm run lint`, `npm run build` 통과

### 주의할 현재 한계

- 카카오 로그인은 버튼만 있고 provider 미연동
- Service2의 교육과정 PDF AI 파싱 기능은 remix 버전에 있었고 현재 통합본에는 없음
- Service5 원본의 Excel/Markdown 다운로드, 누적 분석, D3 워드클라우드는 축소됨
- Service3/5 분석 프롬프트는 대학 가이드북 철학을 반영하지만 RAG 방식으로 PDF 원문을 직접 검색하지는 않음
- 세특 PDF 자료 전체를 RAG/reference snippet으로 검색하는 구조는 아직 없음
- Supabase schema/RLS 기준은 문서화됐고, 실제 migration 파일은 아직 없음
- Next build workspace root 경고는 `next.config.ts`의 `turbopack.root`로 해소됨
- Vercel 배포본만 테스트할 경우 localhost OAuth URL 추가는 필요 없음. 로컬 로그인 테스트 때만 필요

### Phase 0 문서

- [Phase 0 Baseline](../docs/phase-0-baseline.md)
- [Supabase Schema And RLS Baseline](../docs/supabase-schema-rls.md)
- [University Data Baseline](../docs/university-data-baseline.md)

## Phase 0 — 현 상태 안정화 및 기준선 고정

**상태:** 완료 — 2026-04-27

**목표:** 지금 올라온 통합 MVP를 깨끗한 기준선으로 만든다.

### 작업

- lint/build 통과 상태 유지
- `package.json` lint 스크립트 정상화
- Vercel 프로덕션 로그인 확인
  - Google Cloud Console redirect URI: `https://unithing.vercel.app/api/auth/callback/google`
  - Vercel `NEXTAUTH_URL=https://unithing.vercel.app`
  - `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`, Supabase env 확인
- Supabase 테이블/권한 현황 문서화
  - `teachers`
  - `students`
  - `students.segibu_analysis`
  - RLS/teacher 분리 정책
- 현재 입결 JSON 생성 기준 문서화
  - CSV 원본 유효 행: 16,867개
  - 현재 JSON: 16,582개
  - 제외 성격: 주로 실기/논술 전형, 9등급 범위 밖 이상치
- 기본 시나리오 스모크 테스트
  - 로그인
  - 학생 등록
  - 생기부 PDF 또는 텍스트 분석
  - 학생부 리포트 확인
  - 대학 찾기 검색
  - 세특 도우미 최종 생성

### 완료 기준

- `npm run lint` 통과
- `npm run build` 통과
- Vercel 배포본에서 Google 로그인 성공
- 샘플 학생 1명 기준 핵심 흐름 성공

## Phase 1 — 생기부 분석/리포트 완성도 고도화

**상태:** 완료 — 2026-04-27

**목표:** Service3와 Service5를 하나의 분석 엔진과 상담 리포트로 정리한다.

### 원본 참조

- `service/생기부-분석-ai-리포트_ver-최종-완성2/`
- `service/학생부-분석-ai-(school-record-analysis-ai)/`
- `service/학생부-분석-ai-(school-record-analysis-ai)_비판적-관점/`
- `service_source/학생부종합전형 체크리스트.pdf`
- `service_source/2026 서울대/이화여대/서강대/경희대/동국대/건국대 학생부종합전형 가이드북.pdf`
- `service_source/생기부 분석.pdf`
- `service_source/숭신고 생기부.pdf`

### 작업

- Service3 분석 결과 스키마를 최종 확정
  - 점수
  - 등급/교과 평균
  - 창체/교과/행특 구조화
  - 강점/보완점
  - 향후 전략
- Service5를 “Mock”이 아닌 “Service3 결과 기반 비판적 리포트”로 명확히 정리
- 원본 Service5에서 유지할 기능 결정
  - PDF 저장: 유지
  - Excel 다운로드: 필요 여부 결정 후 이식
  - Markdown 다운로드: 필요 여부 결정 후 이식
  - 누적 분석/학생 비교: 상담 현장 필요 여부 결정 후 별도 Phase로 분리
  - D3 워드클라우드: 현재 간이 키워드 클라우드 유지 또는 원본 이식 결정
- 프롬프트에 service_source 평가 자료 반영 상태 점검
  - 현재는 철학/기준을 수동 반영
  - 원문 기반 근거 검색이 필요하면 별도 reference snippet/RAG 구조 설계
- 분석 실패 대응 개선
  - JSON 파싱 실패 시 재시도
  - 이미지 기반 PDF 안내
  - Gemini 응답 지연/제한 안내

### 완료 기준

- `숭신고 생기부.pdf` 기준으로 분석 결과가 안정적으로 생성됨
- Service3와 Service5가 같은 학생 분석 결과를 일관되게 보여줌
- 리포트에서 “현재 수준”과 “보완 방향”이 명확히 보임

## Phase 2 — 대학 찾기/목표 대학 선택 완성

**상태:** 완료 — 2026-04-28

**목표:** Service1을 단순 검색에서 “현재 수준 + 목표 대학 선택” 도구로 발전시킨다.

### 원본 참조

- `service/9등급-환산-적정-대학-찾기(2025학년도-입결-자료)_최종/`
- `service_source/9등급 변환기_2025 어디가 입결.csv`
- `service_source/5등급 변환기 개선점.pdf`
- `service_source/(2025-8)부산광역시교육청 관내 고교 5등급제 성적 분석 자료.pdf`
- `service_source/경기진협 협력교 25학년도 1학년 1-2학기 성적 분석자료(0314)_배포용.pdf`

### 작업

- 입결 JSON 생성 스크립트/기준 repo 안에 문서화
  - `scripts/build-universities-data.mjs`
  - `npm run data:universities -- --check`
- 현재 제외된 전형 정책 확정
  - 교과/종합만 유지할지
  - 논술/실기까지 포함할지
  - 9등급 범위 밖 이상치 처리 방식
- 학생의 생기부 분석 결과와 내신 입력 연결
  - 현재 직접 5등급 입력
  - 향후 학생 프로필/분석 결과에서 prefill
- “3 Picks” 구조 도입
  - 도전/적정/안정 대학 선택
  - 목표 대학 저장
  - 목표 대학 기준 다음 Phase로 연결
- 목표 대학과 현재 학생의 갭 표시
  - 성적 갭
  - 생기부 보완 포인트
  - 관련 과목/세특 추천 연결 버튼

### 완료 기준

- 학생별 목표 대학 3개를 저장할 수 있음
- 목표 대학 선택이 Service2/Service4 입력으로 이어짐
- 데이터 출처와 제외 기준이 화면 또는 문서에서 설명됨

### Phase 2 완료 기록

- Service1 검색 결과 카드에서 `도전`, `적정`, `안정` 목표를 저장할 수 있게 함.
- 저장 위치는 운영 DB 변경을 피하기 위해 `students.naesin_data.university_picks`로 결정함.
- Service1 저장 시 `students.target_dept`도 갱신해 Service2/Service4가 바로 이어받게 함.
- Service1 목표 대학 패널에 생기부 분석의 보완 포인트와 과목/세특 이동 버튼을 연결함.
- Service2는 현재 학생의 목표 학과 또는 primary pick을 검색어/대학 필터로 prefill함.
- 학생 PATCH API는 허용 필드만 업데이트하도록 정리함.
- 입결 CSV -> JSON 생성 스크립트를 추가하고 현재 `universitiesRaw.json` 재현을 확인함.
- 세부 기록: [Phase 2 University Targets](../docs/phase-2-university-targets.md)

## Phase 3 — 과목 가이드 전체 데이터화 및 AI 추천

**상태:** 완료 — 2026-04-28

**목표:** Service2를 정적 가이드에서 목표 대학·학과 기반 과목 설계 도구로 만든다.

### 원본 참조

- `service/2022-개정교육과정-선택과목-가이드_최종_v1.02/`
- `service/remix_-2022-개정교육과정-선택과목-가이드/`
- `service_source/고교학점제_2028학년도 권역별 대학별 권장과목.csv`
- `service_source/2022 개정 교육과정에 따른 고등학교 과목 안내서(압축).pdf`
- `service_source/2025학년도 입학생을 위한 2022 개정 교육과정 선택 과목 안내서.pdf`
- `service_source/[고]2022개정고등학교교육과정총론해설서.pdf`

### 현재 반영 상태

- 원본 `최종_v1.02`의 정적 데이터 파일 3개는 정확히 복사되어 있음
- 현재 대학별 권장과목 데이터는 `UNITHING/src/data/universityData.ts`의 166건 중심
- `service_source/고교학점제_2028학년도 권역별 대학별 권장과목.csv` 전체는 아직 구조화되지 않음
- remix 버전의 교육과정 PDF AI 파싱 기능은 현재 없음

### 작업

- CP949 권장과목 CSV 파서 작성
  - 파싱된 CSV 행: 1,362행
  - 실제 데이터 시작 행: 5행
  - 컬럼: 권역, 지역, 대학명, 모집단위, 핵심과목, 권장과목, 비고
- 권장과목 전체 데이터 API 추가
  - 대학명 검색
  - 모집단위/학과 검색
  - 핵심/권장과목 분리
- 현재 curated 데이터와 전체 CSV 데이터 관계 정리
  - curated: UI/대표 학과 설명용
  - CSV: 대학별 실제 검색용
- 목표 대학 Pick과 연결
  - Service1에서 고른 대학/학과를 Service2에 prefill
- AI 추천 옵션 추가
  - 입력: 목표 대학, 학과, 현재 이수 과목, 학교 교육과정
  - 출력: 2학년/3학년 과목 선택안, 선택 이유, 주의사항
- remix 버전의 교육과정 PDF 파싱 기능 복원 여부 결정

### 완료 기준

- 권장과목 CSV 전체에서 대학/학과 검색 가능
- 목표 대학 Pick 기준으로 과목 설계 결과가 생성됨
- 정적 추천과 AI 추천의 역할이 화면에서 분명함

### Phase 3 완료 기록

- `scripts/build-recommended-subjects-data.mjs`로 CP949 권장과목 CSV를 구조화함.
- `src/data/recommendedSubjectsRaw.json`에 1,358개 실제 데이터 행과 47개 대학을 저장함.
- `GET /api/recommended-subjects`를 추가해 대학/모집단위 검색을 제공함.
- `POST /api/recommend/subjects`를 추가해 목표 대학/학과 기준 2학년·3학년 과목 설계를 생성함.
- Gemini 사용 가능 시 AI JSON 설계를 사용하고, 실패하거나 키가 없으면 rule-based fallback을 반환하게 함.
- Service2 오른쪽 패널에 2028 전체 권장과목 검색과 AI 과목 설계를 연결함.
- 기존 curated 데이터는 과목 설명/선택군/PDF용으로 유지하고, CSV 데이터는 대학별 실제 검색용으로 분리함.
- remix 버전의 학교 교육과정 PDF 파싱은 현 Phase에서 복원하지 않고 추후 판단으로 남김.
- 세부 기록: [Phase 3 Subject Planning](../docs/phase-3-subject-planning.md)

## Phase 4 — 세특 도우미를 생기부 보완 도구로 연결

**상태:** 완료 — 2026-04-28

**목표:** Service4를 독립 세특 생성기가 아니라 생기부 약점 보완 도구로 연결한다.

### 원본 참조

- `service/세특-주제-선정-및-예상-보고서-작성-도우미/`
- `service_source/학생부 분석 및 세특/GPT 세특.txt`
- `service_source/학생부 분석 및 세특/1._교사의_세특_작성요령.txt`
- `service_source/학생부 분석 및 세특/3._입학사정관의_세특평가.txt`
- `service_source/학생부 분석 및 세특/0. 세특 역량.pdf`
- `service_source/학생부 분석 및 세특/2. 고등학교 교과세특 예시.pdf`
- `service_source/학생부 분석 및 세특/4_학생부 쓸때 좋은 말.pdf`

### 현재 반영 상태

- 원본 6단계 흐름은 반영됨
- 서울대형 7단계 탐구 프레임 반영됨
- 교사 관점 세특 개요 생성 반영됨
- 세특 자료 전체를 체계적으로 reference화한 상태는 아님

### 작업

- Service3 분석 결과의 보완점에서 세특 주제 자동 후보 생성
  - 부족 역량
  - 희망 학과
  - 목표 대학
  - 선택 예정 과목
- 세특 작성 자료를 프롬프트 기준으로 정리
  - 교사 작성요령
  - 입학사정관 평가 기준
  - 금지어/표현 규칙
- 최종 산출물 개선
  - 탐구 계획서
  - 세특 초안
  - 후속 활동
  - 학생 상담용 한 줄 피드백
- 학생별 결과 저장
  - 현재 localStorage 중심
  - Supabase 저장으로 확장

### 완료 기준

- 생기부 분석의 부족점이 세특 주제 추천으로 이어짐
- 목표 대학/학과/과목 설계가 세특 초안에 반영됨
- 학생별 세특 결과를 저장하고 다시 열 수 있음

### Phase 4 완료 기록

- Service4 시작 화면에 생기부 보완 맥락 패널을 추가함.
- Service3 `admissionsReadiness.criticalWeaknesses`에서 최대 3개 세특 보완 후보를 생성함.
- Service1 목표 대학 3 Picks의 primary pick과 학생 목표 학과를 Service4 입력/프롬프트 맥락으로 연결함.
- Phase 3의 2028 대학별 권장과목 API를 Service4에서 조회해 목표 대학/학과 권장과목 힌트로 사용함.
- `/api/analyze/seteuk` 최종 생성 프롬프트에 목표 대학, 목표 모집단위, 기존 활동/보완 맥락, 생기부 보완점, 권장과목 힌트를 추가함.
- 교사 세특 작성요령, 입학사정관 세특 평가 기준, 세특 역량 자료의 핵심 원칙을 프롬프트 규칙으로 반영함.
- 최종 생성 결과를 `students.naesin_data.seteuk_records`와 `students.naesin_data.seteuk_latest`에 저장함.
- Service4 localStorage 임시 저장을 학생별 키로 분리함.
- 저장된 세특 결과를 현재 학생 기준으로 다시 불러올 수 있게 함.
- 세부 기록: [Phase 4 Seteuk Remediation](../docs/phase-4-seteuk-remediation.md)

## Phase 5 — 통합 상담 로드맵 화면

**상태:** 완료 — 2026-04-28

**목표:** 5개 탭 결과를 하나의 상담 결과물로 묶는다.

### 작업

- 학생별 “진학 설계 로드맵” 화면 추가
  - 현재 생기부 요약
  - 추천/목표 대학 3 Picks
  - 목표 대학별 갭
  - 과목 선택안
  - 세특 주제/활동안
  - 다음 상담 때 확인할 체크리스트
- PDF 출력 또는 상담지 저장
- 탭 간 데이터 전달 정리
  - currentStudent
  - selectedPicks
  - subjectPlan
  - seteukPlan
- 화면 문구를 “진단”보다 “처방/역설계” 중심으로 정리

### 완료 기준

- 선생님이 학생 1명 상담 후 하나의 로드맵을 출력할 수 있음
- “이 대학에 가려면 지금부터 무엇을 해야 하는지”가 명확함

### Phase 5 완료 기록

- 대시보드에 `상담 로드맵` 탭을 추가함.
- `Service6Roadmap`을 추가해 학생 프로필, Service3 분석, Service1 목표 대학 3 Picks, Phase 3 권장과목 API, Service4 최신 세특 결과를 한 화면에 통합함.
- 준비 상태 스트립으로 생기부 분석/목표 대학/과목 설계/세특 활동의 완료 여부를 표시함.
- 목표 대학 3 Picks와 기준 등급/현재 대비 갭을 로드맵에서 확인할 수 있게 함.
- 목표 대학/학과 기준 2028 권장과목을 조회해 2학년 우선 확인/3학년 심화 연결 후보로 표시함.
- 최신 세특 결과의 주제, 한 줄 피드백, 후속 활동을 로드맵에 연결함.
- 누락 항목 또는 실행 확인 항목을 다음 상담 체크리스트로 자동 구성함.
- 로드맵 현재 상태를 `students.naesin_data.roadmap_latest`에 저장할 수 있게 함.
- 상담지 Markdown 다운로드와 브라우저 출력 버튼을 추가함.
- 세부 기록: [Phase 5 Consulting Roadmap](../docs/phase-5-consulting-roadmap.md)

## Phase 6 — 운영 안정화 및 배포 관리

**목표:** 실제 무료 공개 운영에 필요한 안전장치를 붙인다.

### 작업

- Supabase schema/migration 파일 추가
- RLS 정책 재점검
- 개인정보/생기부 취급 안내
- AI 사용량 제한 정책
  - 일일 분석 N건
  - 선생님별 사용량
  - 초과 안내 문구
- 에러/로그 모니터링
- Vercel env 동기화
- 필요 시 GCP Cloud Run 전환 여부 재검토
- 카카오 로그인 provider 연결
- 광고/도서 사이드바 운영 콘텐츠 확정

### 완료 기준

- 학교/선생님 대상 무료 공개 전에 개인정보·비용·권한 리스크가 정리됨
- 배포/환경변수/DB 세팅을 새 환경에서 재현 가능함

## 우선 작업 큐

1. Phase 0 완료
   - Vercel 로그인, Supabase/입결 기준선, lint/build 기준선 고정
2. Phase 1 완료
   - 생기부 분석/리포트 상담 처방 스키마 고도화
3. Phase 2 완료
   - 목표 대학 3 Picks 저장 및 다음 서비스 연결
4. Phase 3 완료
   - 권장과목 CSV 전체 데이터화, API, 목표 대학 기반 과목 설계
5. Phase 4 완료
   - 생기부 보완점 기반 세특 추천 연결
   - 목표 대학/과목 설계를 세특 주제 후보에 반영
6. Phase 5 완료
   - 상담 로드맵 탭 추가 및 저장/출력 연결

## 작업 원칙

- 원본 서비스의 기능을 무조건 복사하지 말고 상담 흐름에 필요한 기능을 우선한다.
- 데이터 출처가 있는 기능은 필터/가공 기준을 반드시 문서화한다.
- AI 프롬프트는 실제 샘플 자료로 품질을 확인한 뒤 고정한다.
- 새로운 Phase를 시작하기 전 이전 Phase의 완료 기준을 체크한다.
- Vercel 배포본 테스트와 로컬 로그인 테스트를 혼동하지 않는다.
