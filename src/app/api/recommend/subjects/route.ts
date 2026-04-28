import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkAiQuota } from '@/lib/aiUsage';
import type { SubjectRecommendationPlan, UniversitySubjectRecord } from '@/types/subjects';

type SubjectRecommendationRequest = {
  targetUniversity?: string;
  targetMajor?: string;
  selectedMajor?: string;
  selectedMajorSubjects?: string[];
  universityRecords?: UniversitySubjectRecord[];
  weaknesses?: string[];
};

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function collectSubjects(body: SubjectRecommendationRequest) {
  const core = uniq((body.universityRecords ?? []).flatMap((record) => record.coreSubjects));
  const recommended = uniq((body.universityRecords ?? []).flatMap((record) => record.recommendedSubjects));
  const curated = uniq(body.selectedMajorSubjects ?? []);

  return {
    core,
    recommended,
    supporting: curated.filter((subject) => !core.includes(subject) && !recommended.includes(subject)),
  };
}

function fallbackPlan(body: SubjectRecommendationRequest): SubjectRecommendationPlan {
  const subjects = collectSubjects(body);
  const grade2Core = subjects.core.slice(0, 4);
  const grade2Recommended = subjects.recommended.slice(0, Math.max(0, 6 - grade2Core.length));
  const grade3Recommended = subjects.recommended.filter((subject) => !grade2Recommended.includes(subject)).slice(0, 4);
  const grade3Supporting = subjects.supporting.slice(0, Math.max(0, 6 - grade3Recommended.length));

  return {
    summary: `${body.targetUniversity || '목표 대학'} ${body.targetMajor || body.selectedMajor || '목표 학과'} 기준으로 핵심과목을 먼저 확보하고, 권장과목과 전공 연계 과목을 3학년까지 이어가는 설계입니다.`,
    grade2: [
      ...grade2Core.map((subject) => ({ subject, reason: '대학 자료의 핵심과목으로 분류되어 우선 이수 필요성이 높습니다.', priority: 'core' as const })),
      ...grade2Recommended.map((subject) => ({ subject, reason: '대학 자료의 권장과목으로 전공 적합성 근거를 보완합니다.', priority: 'recommended' as const })),
    ],
    grade3: [
      ...grade3Recommended.map((subject) => ({ subject, reason: '2학년 이후 심화 연계 과목으로 배치해 전공 관심의 지속성을 보여줍니다.', priority: 'recommended' as const })),
      ...grade3Supporting.map((subject) => ({ subject, reason: '현재 선택과목 가이드의 전공 추천 과목으로 탐구 활동과 연결하기 좋습니다.', priority: 'supporting' as const })),
    ],
    cautions: [
      '학교 개설 과목과 선택군 충돌 여부를 먼저 확인해야 합니다.',
      '핵심과목이 일반 문장으로만 제시된 대학은 모집단위별 세부 과목을 추가 확인해야 합니다.',
      '입시 전형별 반영 방식이 바뀔 수 있으므로 최종 모집요강 확인이 필요합니다.',
    ],
    evidence: [
      `대학 권장과목 매칭 ${body.universityRecords?.length ?? 0}건`,
      `핵심과목 ${subjects.core.length}개, 권장과목 ${subjects.recommended.length}개`,
      `전공 가이드 추천 과목 ${subjects.supporting.length + subjects.core.length + subjects.recommended.length}개`,
    ],
  };
}

function extractJson(text: string) {
  const trimmed = text.trim().replace(/^```json?\s*/, '').replace(/```\s*$/, '');
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function normalizePlan(value: unknown, fallback: SubjectRecommendationPlan): SubjectRecommendationPlan {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  type PlanItem = SubjectRecommendationPlan['grade2'][number];
  const normalizeItems = (items: unknown, fallbackItems: SubjectRecommendationPlan['grade2']) => {
    if (!Array.isArray(items)) return fallbackItems;
    return items.slice(0, 8).flatMap<PlanItem>((item) => {
      if (!item || typeof item !== 'object') return [];
      const raw = item as Record<string, unknown>;
      const priority: PlanItem['priority'] = raw.priority === 'core' || raw.priority === 'recommended' || raw.priority === 'supporting' ? raw.priority : 'supporting';
      const entry: PlanItem = {
        subject: String(raw.subject ?? '').trim(),
        reason: String(raw.reason ?? '').trim(),
        priority,
      };
      return entry.subject && entry.reason ? [entry] : [];
    });
  };

  return {
    summary: typeof record.summary === 'string' && record.summary.trim() ? record.summary.trim() : fallback.summary,
    grade2: normalizeItems(record.grade2, fallback.grade2),
    grade3: normalizeItems(record.grade3, fallback.grade3),
    cautions: Array.isArray(record.cautions) ? record.cautions.map(String).filter(Boolean).slice(0, 5) : fallback.cautions,
    evidence: Array.isArray(record.evidence) ? record.evidence.map(String).filter(Boolean).slice(0, 6) : fallback.evidence,
  };
}

export async function POST(req: Request) {
  const body = await req.json() as SubjectRecommendationRequest;
  const fallback = fallbackPlan(body);
  const session = await getServerSession(authOptions);
  const teacherId = (session?.user as { teacherId?: string } | undefined)?.teacherId;

  if (!teacherId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ plan: fallback, mode: 'rule-based' });
  }

  const quota = checkAiQuota('subjects', teacherId);
  if (!quota.ok) return Response.json({ error: quota.error, limit: quota.limit, remaining: quota.remaining }, { status: quota.status });

  const sourceRows = (body.universityRecords ?? []).slice(0, 8).map((record) => ({
    university: record.university,
    major: record.unit,
    core: record.core,
    recommended: record.recommended,
    note: record.note,
  }));

  const prompt = `목표 대학/학과 기준으로 고등학교 2-3학년 선택과목 설계를 만들어줘.
코드블록 없이 JSON만 출력:
{
  "summary": "상담 요약",
  "grade2": [{"subject":"과목명","reason":"선택 이유","priority":"core|recommended|supporting"}],
  "grade3": [{"subject":"과목명","reason":"선택 이유","priority":"core|recommended|supporting"}],
  "cautions": ["주의사항"],
  "evidence": ["근거"]
}

[학생/목표]
- 목표 대학: ${body.targetUniversity || '-'}
- 목표 모집단위: ${body.targetMajor || '-'}
- 선택한 전공 가이드 학과: ${body.selectedMajor || '-'}
- 생기부 보완 포인트: ${(body.weaknesses ?? []).join(' / ') || '-'}

[대학 권장과목 자료]
${JSON.stringify(sourceRows, null, 2)}

[현재 전공 가이드 추천 과목]
${(body.selectedMajorSubjects ?? []).join(', ') || '-'}

[작성 기준]
- 대학 자료의 핵심과목은 priority core로 우선 배치해.
- 대학 자료의 권장과목은 priority recommended로 배치해.
- 전공 가이드에는 있지만 대학 자료에는 없는 과목은 supporting으로 배치해.
- 학교 개설 여부와 선택군 충돌 가능성을 cautions에 포함해.
- 2학년은 기초/핵심, 3학년은 심화/탐구 연결 중심으로 나눠줘.`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    });
    const result = await model.generateContent(prompt);
    const plan = normalizePlan(JSON.parse(extractJson(result.response.text())), fallback);
    return Response.json({ plan, mode: 'ai' });
  } catch {
    return Response.json({ plan: fallback, mode: 'rule-based-fallback' });
  }
}
