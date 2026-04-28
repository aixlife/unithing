import { GoogleGenerativeAI, type Content, type GenerationConfig, type GenerativeModel } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkAiQuota } from '@/lib/aiUsage';
import { normalizeSegibuAnalysis } from '@/lib/segibuAnalysis';
import type { AdmissionsReadiness, CompKey, SegibuAnalysis } from '@/types/analysis';

const SYSTEM_INSTRUCTION = `당신은 고등학교 생활기록부(생기부)를 실제 입학사정관의 관점에서 정밀하게 분석하는 '생기부 분석 전문 AI'입니다.
본 분석은 서울대, 이화여대, 서강대, 경희대, 동국대, 건국대 등 주요 대학의 학생부종합전형 평가 기준을 종합적으로 반영합니다.

**[핵심 평가 철학 — 반드시 준수]**

1. **과정 중심 평가**: 결과(등급, 수상 개수)보다 학습·활동의 과정과 성장을 봅니다. 세특과 행특에서 '어떻게 탐구했는가', '어떤 변화가 있었는가'를 중심으로 분석하세요.

2. **교과성적 정성 평가**: 등급 숫자만 보지 마세요. 수강자 수, 원점수, 평균, 표준편차, 성취도 분포(A/B/C 비율)를 고려해 실질적인 학업 수준을 판단하세요.
   - 소수 수강(20명 이하) 과목이나 어려운 진로선택 과목에 도전한 것 자체를 긍정적으로 평가하세요.
   - 일반선택 → 진로선택 → 융합선택의 위계적 이수 여부와 전공 연계성을 평가하세요.

3. **리더십의 다양한 형태 인정**: 학급 임원·동아리 회장 이력이 없어도, 토론에서 의견을 이끌거나, 갈등을 조화롭게 해결하거나, 모둠원을 독려하고 함께 성장시킨 경험 모두 리더십으로 인정하세요.

4. **공동체역량 = 활동의 질**: 봉사시간 합계나 임원 경력 개수가 아닌, 나눔과 배려의 구체적 실천, 협업과 소통 과정의 진정성을 평가하세요.

5. **진로 변경은 감점 아님**: 진로가 바뀌었더라도, '왜 바뀌었는가'의 고민 과정과 변경 후 관련 활동의 일관성과 깊이가 중요합니다.

6. **비판적·객관적 시각**: 단순 나열이나 칭찬에 그치지 말고, 역량이 실제로 어떻게 증명되었는지, 무엇이 부족한지 날카롭게 지적해 주세요.

**[평가 역량 기준]**
- 학업역량: 대학 수학에 필요한 기초 교과 성취 + 자기주도적 학습 태도 + 지적 탐구력
- 진로역량: 전공(계열) 관련 교과 이수 노력 및 성취도 + 진로 탐색 활동과 경험의 깊이
- 공동체역량: 협업과 소통 + 나눔과 배려 + 성실성과 규칙준수 + 다양한 형태의 리더십

입력된 데이터를 바탕으로 반드시 아래의 [Output Format] 형태를 엄격히 지켜서 출력해 주세요.

[Output Format]
1. 먼저 텍스트 기반의 요약 리포트를 Markdown 형식으로 작성하세요. 제목은 '# 📝 심층 분석 리포트'로 시작하세요.
   - 제목 바로 아래에 다음 주의사항을 반드시 포함하세요:
     *(본 심층 리포트는 주요 대학 학생부종합전형 가이드북을 기반으로 한 평가 결과이며, 지원 대학·학과별 평가 기준에 따라 결과는 달라질 수 있습니다.)*
   - 리포트 구성 시 각 항목(학업, 진로, 공동체) 내에서 반드시 다음의 가독성 구조를 엄격히 지키세요:
     1. 소제목은 '## 1. 학업 역량 (Academic Competency)'와 같이 작성하세요.
     2. 그 바로 아래에 '**우수한 점(Good)**'을 굵게 표시하고 반드시 한 줄을 띄우세요.
     3. 그 아래에 구체적인 사례들을 리스트(-) 형식으로 나열하세요. 각 항목에 구체적인 세특 내용이나 활동 근거를 인용하세요.
     4. 리스트가 끝나면 한 줄을 띄우고 '**개선 및 보완점(Improvement)**'을 굵게 표시하고 한 줄을 띄우세요.
     5. 그 아래에 보완점들을 리스트(-) 형식으로 나열하세요.
   - 학업역량 분석 시: 교과 등급 추이(학년별 변화 포함), 전공 연계 교과 이수 위계(일반→진로선택 여부), 세특에서 드러난 지적 탐구력을 종합 분석하세요.
   - 진로역량 분석 시: 진로의 일관성 또는 변화의 맥락, 전공 관련 심화 탐구의 깊이와 자기주도성을 평가하세요.
   - 공동체역량 분석 시: 임원직 여부와 무관하게 협업·소통·나눔·배려의 구체적 장면을 찾아 분석하세요.
   - 리포트 마지막 섹션인 '## 5. 향후 전략 및 제언'에서는 반드시 지원 학과와 연계된 구체적인 교과목(일반선택/진로선택 구분)을 언급하고, 앞으로 탐구할 수 있는 구체적인 심화 주제 3가지 이상을 포함하여 상세히 기술하세요.

2. 그 다음, 반드시 아래 JSON 형식을 포함하여 상세 데이터를 구조화해 주세요.

\`\`\`json
{
  "scores": { "academic": 72, "career": 75, "community": 68 },
  "summaryHighlights": {
    "academic": "학업역량 핵심 요약 (100~150자, 등급 추이 + 탐구력 특징 포함)",
    "career": "진로역량 핵심 요약 (100~150자, 전공 연계 교과 + 진로 탐색 활동 포함)",
    "community": "공동체역량 핵심 요약 (100~150자, 협업·나눔·리더십 구체 사례 포함)"
  },
  "futureStrategy": {
    "deepDive": "심화 탐구 제안 (구체적 주제 3가지 이상, 각 주제에 연계 교과·활동 방향 포함)",
    "subjects": "연계 과목 제안 (일반선택/진로선택 구분하여 제시)"
  },
  "admissionsReadiness": {
    "overall": "입학사정관 관점의 한 줄 종합 판단. 현재 학생부가 목표 학과 상담에서 어떤 상태인지 냉정하게 요약",
    "criticalWeaknesses": [
      {
        "competency": "academic",
        "issue": "가장 먼저 보완해야 할 약점",
        "evidence": "생기부 원문에서 확인되는 근거",
        "recommendation": "상담 현장에서 바로 제시할 처방"
      },
      {
        "competency": "career",
        "issue": "두 번째 보완점",
        "evidence": "생기부 원문 근거",
        "recommendation": "대학/학과/과목/세특으로 이어지는 처방"
      }
    ],
    "nextActions": [
      {
        "priority": 1,
        "action": "다음에 해야 할 상담/서비스 액션",
        "linkedService": "university",
        "reason": "왜 이 액션이 필요한지"
      },
      {
        "priority": 2,
        "action": "세특 또는 과목 설계 액션",
        "linkedService": "seteuk",
        "reason": "생기부 보완점과 연결되는 이유"
      }
    ],
    "reliability": {
      "confidence": "high",
      "missingData": ["분석 신뢰도를 낮추는 누락 데이터가 있으면 항목별로 작성"],
      "notes": "성적/창체/세특/행특 중 어떤 근거가 충분하거나 부족했는지 설명"
    }
  },
  "grades": {
    "korean":  { "s1_1": null, "s1_2": null, "s2_1": null, "s2_2": null, "s3_1": null, "avg": null },
    "math":    { "s1_1": null, "s1_2": null, "s2_1": null, "s2_2": null, "s3_1": null, "avg": null },
    "english": { "s1_1": null, "s1_2": null, "s2_1": null, "s2_2": null, "s3_1": null, "avg": null },
    "social":  { "s1_1": null, "s1_2": null, "s2_1": null, "s2_2": null, "s3_1": null, "avg": null },
    "science": { "s1_1": null, "s1_2": null, "s2_1": null, "s2_2": null, "s3_1": null, "avg": null },
    "others":  { "s1_1": null, "s1_2": null, "s2_1": null, "s2_2": null, "s3_1": null, "avg": null },
    "total":   { "s1_1": null, "s1_2": null, "s2_1": null, "s2_2": null, "s3_1": null, "avg": null }
  },
  "groupAverages": { "all": null, "kems": null, "kemSo": null, "kemSc": null },
  "highlights": {
    "changche": {
      "individual": { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "club":       { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "career_act": { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} }
    },
    "curriculum": {
      "korean":   { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "math":     { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "english":  { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "social":   { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "science":  { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "liberal":  { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} },
      "arts_phys":{ "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} }
    },
    "behavior": { "y1": {"academic":"","career":"","community":""}, "y2": {"academic":"","career":"","community":""}, "y3": {"academic":"","career":"","community":""} }
  },
  "structuredData": {
    "changche": {
      "individual": { "y1": "원본텍스트전체", "y2": "원본텍스트전체", "y3": "원본텍스트전체" },
      "club":       { "y1": "", "y2": "", "y3": "" },
      "career_act": { "y1": "", "y2": "", "y3": "" }
    },
    "curriculum": {
      "korean":   { "y1": "", "y2": "", "y3": "" },
      "math":     { "y1": "", "y2": "", "y3": "" },
      "english":  { "y1": "", "y2": "", "y3": "" },
      "social":   { "y1": "", "y2": "", "y3": "" },
      "science":  { "y1": "", "y2": "", "y3": "" },
      "liberal":  { "y1": "", "y2": "", "y3": "" },
      "arts_phys":{ "y1": "", "y2": "", "y3": "" }
    },
    "behavior": { "y1": "", "y2": "", "y3": "" }
  },
  "studentName": "학생 이름 (없으면 '학생')",
  "school": "학교명",
  "grade": "학년",
  "targetDept": "희망 학과"
}
\`\`\`

※ 분석 지시사항:
- grades: 교과학습발달상황에서 교과별 학기별 단위수 가중 평균 등급을 소수점 첫째 자리까지 계산. 진로선택 과목(등급 미부여)은 별도 언급. 성적 없는 항목은 null.
- groupAverages: all(전과목), kems(국영수사과), kemSo(국영수사), kemSc(국영수과) 전체 평균을 소수점 둘째 자리까지.
- structuredData: 창체/교과/행특 원본 텍스트를 학년별로 누락 없이 전체 추출.
- highlights: structuredData 내용에서 학업/진로/공동체 역량별 핵심 문구 요약 (단순 나열 금지, 역량 증거 중심으로).
- 역량 점수 기준 (엄격히 적용):
  * 55점 이하: 해당 역량이 생기부에서 거의 드러나지 않음
  * 60~65점: 기본적인 활동은 있으나 깊이나 일관성이 부족함
  * 70점: 전국 평균 수준. 평범한 고등학생이 보이는 수준
  * 75~80점: 평균 이상. 성실성과 구체적인 탐구 근거가 있음
  * 83~87점: 우수. 자기주도적 탐구와 성장 과정이 뚜렷하게 증명됨
  * 90~94점: 매우 우수. 수도권 상위권 대학 합격자 수준의 역량 증거
  * 95점 이상: 최상위권. 서울대·최상위권 합격 수준에만 부여
  * ⚠️ 90점 이상은 정말 예외적인 경우에만 부여하세요. 대부분의 생기부는 70~83점 범위에 해당합니다.
  * ⚠️ 세 역량 평균은 원칙적으로 78~82점 전후가 되도록 변별력을 유지하세요. 내신 등급이 높다는 이유만으로 90점 이상을 주지 마세요.
  * ⚠️ 전국 단위 수상, 논문급 산출물, 3년 연속 전공 심화 탐구처럼 최상위권 근거가 명확하지 않으면 개별 역량도 88점을 넘기지 마세요.

※ 상담 연결 지시:
- 학생부종합전형 체크리스트의 세부 기준을 반드시 반영하세요.
  - 학업역량: 학업 성취도, 학업 태도, 탐구력
  - 진로역량: 전공 관련 교과 이수노력, 전공 관련 교과 성취도, 진로 탐색 활동과 경험
  - 공동체역량: 협업과 소통, 나눔과 배려, 성실성과 규칙준수, 리더십
- admissionsReadiness.criticalWeaknesses에는 단순한 감상이 아니라 "원문 근거 -> 약점 -> 처방"의 순서가 드러나야 합니다.
- admissionsReadiness.nextActions는 UNITHING의 다음 서비스 흐름에 맞춰 작성하세요.
  - university: 대학 찾기/목표 대학 선택
  - subject: 목표 대학·학과 기준 과목 설계
  - seteuk: 부족 역량을 보완하는 세특 활동 설계
  - report: 학생부 리포트/상담 기록 정리
- reliability.confidence는 high, medium, low 중 하나만 사용하세요. 성적표, 창체, 세특, 행특 중 핵심 데이터가 누락되면 medium 또는 low로 낮추세요.`;

const GENERATION_CONFIG = {
  thinkingConfig: { thinkingBudget: 0 },
} as GenerationConfig;

const DEFAULT_READINESS: AdmissionsReadiness = {
  overall: '분석 결과를 바탕으로 대학 찾기, 과목 설계, 세특 보완을 순차적으로 진행해야 합니다.',
  criticalWeaknesses: [],
  nextActions: [
    {
      priority: 1,
      action: '목표 대학과 학과를 먼저 정해 현재 학생부와의 차이를 확인하세요.',
      linkedService: 'university',
      reason: '목표가 정해져야 과목 선택과 세특 보완 방향을 구체화할 수 있습니다.',
    },
  ],
  reliability: {
    confidence: 'medium',
    missingData: [],
    notes: 'AI 응답에 상담 처방 구조가 없어 기본 안내를 표시합니다.',
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (value == null) return fallback;
  return String(value).trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => asString(v)).filter(Boolean);
}

function isCompKey(value: unknown): value is CompKey {
  return value === 'academic' || value === 'career' || value === 'community';
}

function normalizeConfidence(value: unknown): AdmissionsReadiness['reliability']['confidence'] {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  if (value === '높음') return 'high';
  if (value === '낮음') return 'low';
  return 'medium';
}

function normalizeLinkedService(value: unknown): AdmissionsReadiness['nextActions'][number]['linkedService'] {
  if (value === 'university' || value === 'subject' || value === 'seteuk' || value === 'report') return value;
  return 'report';
}

function normalizePriority(value: unknown, fallback: number): AdmissionsReadiness['nextActions'][number]['priority'] {
  const n = typeof value === 'number' ? value : Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return fallback as AdmissionsReadiness['nextActions'][number]['priority'];
}

function normalizeReadiness(value: unknown): AdmissionsReadiness {
  const raw = asRecord(value);
  const weaknesses = Array.isArray(raw.criticalWeaknesses) ? raw.criticalWeaknesses : [];
  const actions = Array.isArray(raw.nextActions) ? raw.nextActions : [];
  const reliability = asRecord(raw.reliability);

  return {
    overall: asString(raw.overall, DEFAULT_READINESS.overall),
    criticalWeaknesses: weaknesses.slice(0, 5).map((item) => {
      const record = asRecord(item);
      return {
        competency: isCompKey(record.competency) ? record.competency : 'academic',
        issue: asString(record.issue, '구체적인 보완점 확인 필요'),
        evidence: asString(record.evidence, '생기부 원문 근거 확인 필요'),
        recommendation: asString(record.recommendation, '후속 상담에서 보완 활동을 구체화하세요.'),
      };
    }),
    nextActions: actions.slice(0, 5).map((item, idx) => {
      const record = asRecord(item);
      return {
        priority: normalizePriority(record.priority, Math.min(idx + 1, 5)),
        action: asString(record.action, '후속 상담 액션을 정리하세요.'),
        linkedService: normalizeLinkedService(record.linkedService),
        reason: asString(record.reason, '생기부 분석 결과와 연결되는 후속 조치입니다.'),
      };
    }),
    reliability: {
      confidence: normalizeConfidence(reliability.confidence),
      missingData: asStringArray(reliability.missingData),
      notes: asString(reliability.notes, DEFAULT_READINESS.reliability.notes),
    },
  };
}

function normalizeScore(value: unknown): number {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return 70;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calibrateScores(value: unknown): SegibuAnalysis['scores'] {
  const raw = asRecord(value);
  const capped = {
    academic: Math.min(normalizeScore(raw.academic), 88),
    career: Math.min(normalizeScore(raw.career), 88),
    community: Math.min(normalizeScore(raw.community), 88),
  };
  const avg = (capped.academic + capped.career + capped.community) / 3;
  if (avg <= 82) return capped;

  const adjustment = avg - 82;
  return {
    academic: Math.max(55, Math.round(capped.academic - adjustment)),
    career: Math.max(55, Math.round(capped.career - adjustment)),
    community: Math.max(55, Math.round(capped.community - adjustment)),
  };
}

function extractJsonText(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) return raw.slice(first, last + 1).trim();

  throw new Error('JSON 파싱 실패 — AI 응답에 JSON 블록이 없습니다.');
}

function stripJsonFromReport(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*[\s\S]*?```/i);
  if (fenced) return raw.replace(fenced[0], '').trim();

  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return `${raw.slice(0, first)}${raw.slice(last + 1)}`.trim();
  }
  return raw.trim();
}

function parseAnalysis(raw: string): SegibuAnalysis {
  const parsed = JSON.parse(extractJsonText(raw)) as Record<string, unknown>;
  const normalized = normalizeSegibuAnalysis({
    ...parsed,
    scores: calibrateScores(parsed.scores),
    admissionsReadiness: normalizeReadiness(parsed.admissionsReadiness),
    report: stripJsonFromReport(raw),
  });
  if (!normalized) throw new Error('JSON 파싱 실패 — AI 응답에 분석 데이터가 없습니다.');
  return normalized;
}

async function generateAnalysis(model: GenerativeModel, contents: Content[]): Promise<SegibuAnalysis> {
  const result = await model.generateContent({ contents, generationConfig: GENERATION_CONFIG });
  const raw = result.response.text().trim();

  try {
    return parseAnalysis(raw);
  } catch (firstError) {
    const repair = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `아래 AI 응답은 JSON 파싱에 실패했습니다. 내용을 새로 분석하지 말고, 기존 내용을 보존하면서 "마크다운 리포트 + \`\`\`json ... \`\`\`" 형식으로만 고쳐서 다시 출력하세요.\n\n[파싱 오류]\n${String(firstError)}\n\n[원본 응답]\n${raw}`,
        }],
      }],
      generationConfig: GENERATION_CONFIG,
    });
    return parseAnalysis(repair.response.text().trim());
  }
}

function getErrorDetail(error: unknown): string {
  const message = String(error);
  if (message.includes('API_KEY_INVALID') || message.includes('API Key not found')) {
    return 'Gemini API 키가 유효하지 않습니다. 로컬 .env.local 또는 Vercel 환경변수의 GEMINI_API_KEY를 확인해 주세요.';
  }
  if (message.includes('JSON 파싱 실패')) {
    return 'AI 응답 형식이 올바르지 않습니다. 다시 분석을 실행해 주세요.';
  }
  if (message.includes('quota') || message.includes('429')) {
    return 'Gemini API 사용량 제한에 걸렸을 수 있습니다. 잠시 후 다시 시도해 주세요.';
  }
  return message;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const teacherId = (session?.user as { teacherId?: string } | undefined)?.teacherId;
    const quota = checkAiQuota('segibu', teacherId);
    if (!quota.ok) return Response.json({ error: quota.error, limit: quota.limit, remaining: quota.remaining }, { status: quota.status });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parts: any[];
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.text) return Response.json({ error: '텍스트가 없습니다' }, { status: 400 });
      parts = [{ text: `[생기부 원문]\n${body.text}\n\n위 생기부를 분석하여 지시한 형식대로 마크다운 리포트와 JSON 데이터를 출력하세요.` }];
    } else {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return Response.json({ error: '파일이 없습니다' }, { status: 400 });
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      parts = [
        { inlineData: { mimeType: 'application/pdf', data: base64 } },
        { text: '위 생기부를 분석하여 지시한 형식대로 마크다운 리포트와 JSON 데이터를 출력하세요.' },
      ];
    }

    const analysis = await generateAnalysis(model, [{ role: 'user', parts }]);
    return Response.json(analysis);
  } catch (e) {
    console.error(e);
    return Response.json({ error: '분석 실패', detail: getErrorDetail(e) }, { status: 500 });
  }
}
