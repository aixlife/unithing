import type {
  AdmissionsReadiness,
  CategoryGrades,
  CompHighlight,
  CompKey,
  GradeMatrix,
  SegibuAnalysis,
  YearData,
  YearHighlights,
} from '@/types/analysis';

type UnknownRecord = Record<string, unknown>;

const SEM_KEYS = ['s1_1', 's1_2', 's2_1', 's2_2', 's3_1', 'avg'] as const;
const GRADE_KEYS = ['korean', 'math', 'english', 'social', 'science', 'others', 'total'] as const;
const CHANGCHE_KEYS = ['individual', 'club', 'career_act'] as const;
const CURRICULUM_KEYS = ['korean', 'math', 'english', 'social', 'science', 'liberal', 'arts_phys'] as const;

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

const KEY_ALIASES = {
  korean: ['korean', '국어'],
  math: ['math', '수학'],
  english: ['english', '영어'],
  social: ['social', '사회', '사회탐구'],
  science: ['science', '과학', '과학탐구'],
  others: ['others', '기타', '그외', '그 외'],
  total: ['total', '전체', '종합'],
  individual: ['individual', 'autonomous', '자율활동', '자율'],
  club: ['club', '동아리활동', '동아리'],
  career_act: ['career_act', 'careerAct', 'careerActivity', '진로활동', '진로'],
  liberal: ['liberal', '정보·교양', '정보/교양', '정보', '교양', '기술가정'],
  arts_phys: ['arts_phys', 'artsPhys', '예체능', '체육예술', '체육·예술', '예술체육'],
} as const;

const YEAR_ALIASES = {
  y1: ['y1', '1', '1학년', 'grade1', 'grade_1'],
  y2: ['y2', '2', '2학년', 'grade2', 'grade_2'],
  y3: ['y3', '3', '3학년', 'grade3', 'grade_3'],
} as const;

const SEM_ALIASES = {
  s1_1: ['s1_1', '1-1', '1학년1학기', '1학년 1학기'],
  s1_2: ['s1_2', '1-2', '1학년2학기', '1학년 2학기'],
  s2_1: ['s2_1', '2-1', '2학년1학기', '2학년 1학기'],
  s2_2: ['s2_2', '2-2', '2학년2학기', '2학년 2학기'],
  s3_1: ['s3_1', '3-1', '3학년1학기', '3학년 1학기'],
  avg: ['avg', 'average', '평균'],
} as const;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as UnknownRecord : {};
}

function pick(raw: UnknownRecord, aliases: readonly string[]): unknown {
  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) return raw[key];
  }
  return undefined;
}

function toText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (value == null) return fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(item => toText(item)).filter(Boolean).join('\n');
  if (typeof value === 'object') return Object.values(value).map(item => toText(item)).filter(Boolean).join('\n');
  return fallback;
}

function toOptionalText(value: unknown): string | undefined {
  const text = toText(value);
  return text || undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => toText(item)).filter(Boolean);
}

function normalizeNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeScore(value: unknown): number {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return 70;
  return Math.max(0, Math.min(100, Math.round(score)));
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
  return Math.min(Math.max(fallback, 1), 5) as AdmissionsReadiness['nextActions'][number]['priority'];
}

function normalizeCategoryGrades(value: unknown): CategoryGrades {
  const raw = asRecord(value);
  return SEM_KEYS.reduce((acc, key) => {
    acc[key] = normalizeNumber(pick(raw, SEM_ALIASES[key]));
    return acc;
  }, {} as CategoryGrades);
}

function normalizeGrades(value: unknown): GradeMatrix {
  const raw = asRecord(value);
  return GRADE_KEYS.reduce((acc, key) => {
    acc[key] = normalizeCategoryGrades(pick(raw, KEY_ALIASES[key]));
    return acc;
  }, {} as GradeMatrix);
}

function normalizeScores(value: unknown): SegibuAnalysis['scores'] {
  const raw = asRecord(value);
  return {
    academic: normalizeScore(raw.academic),
    career: normalizeScore(raw.career),
    community: normalizeScore(raw.community),
  };
}

function normalizeSummaryHighlights(value: unknown): SegibuAnalysis['summaryHighlights'] {
  const raw = asRecord(value);
  return {
    academic: toText(raw.academic),
    career: toText(raw.career),
    community: toText(raw.community),
  };
}

function normalizeFutureStrategy(value: unknown): SegibuAnalysis['futureStrategy'] {
  const raw = asRecord(value);
  return {
    deepDive: toText(raw.deepDive),
    subjects: toText(raw.subjects),
  };
}

function normalizeGroupAverages(value: unknown): SegibuAnalysis['groupAverages'] {
  const raw = asRecord(value);
  return {
    all: normalizeNumber(raw.all),
    kems: normalizeNumber(raw.kems),
    kemSo: normalizeNumber(raw.kemSo),
    kemSc: normalizeNumber(raw.kemSc),
  };
}

function normalizeCompHighlight(value: unknown): CompHighlight {
  const raw = asRecord(value);
  const text = typeof value === 'string' ? value : '';
  return {
    academic: toText(raw.academic, text),
    career: toText(raw.career),
    community: toText(raw.community),
  };
}

function normalizeYearHighlights(value: unknown): YearHighlights {
  const raw = asRecord(value);
  return {
    y1: normalizeCompHighlight(pick(raw, YEAR_ALIASES.y1)),
    y2: normalizeCompHighlight(pick(raw, YEAR_ALIASES.y2)),
    y3: normalizeCompHighlight(pick(raw, YEAR_ALIASES.y3)),
  };
}

function normalizeYearData(value: unknown): YearData {
  const raw = asRecord(value);
  if (typeof value === 'string') return { y1: value, y2: '', y3: '' };
  return {
    y1: toText(pick(raw, YEAR_ALIASES.y1)),
    y2: toText(pick(raw, YEAR_ALIASES.y2)),
    y3: toText(pick(raw, YEAR_ALIASES.y3)),
  };
}

function normalizeHighlightGroups<
  TKey extends typeof CHANGCHE_KEYS[number] | typeof CURRICULUM_KEYS[number],
>(value: unknown, keys: readonly TKey[]): Record<TKey, YearHighlights> {
  const raw = asRecord(value);
  return keys.reduce((acc, key) => {
    acc[key] = normalizeYearHighlights(pick(raw, KEY_ALIASES[key] ?? [key]));
    return acc;
  }, {} as Record<TKey, YearHighlights>);
}

function normalizeDataGroups<
  TKey extends typeof CHANGCHE_KEYS[number] | typeof CURRICULUM_KEYS[number],
>(value: unknown, keys: readonly TKey[]): Record<TKey, YearData> {
  const raw = asRecord(value);
  return keys.reduce((acc, key) => {
    acc[key] = normalizeYearData(pick(raw, KEY_ALIASES[key] ?? [key]));
    return acc;
  }, {} as Record<TKey, YearData>);
}

export function normalizeReadiness(value: unknown): AdmissionsReadiness {
  const raw = asRecord(value);
  const weaknesses = Array.isArray(raw.criticalWeaknesses) ? raw.criticalWeaknesses : [];
  const actions = Array.isArray(raw.nextActions) ? raw.nextActions : [];
  const reliability = asRecord(raw.reliability);

  return {
    overall: toText(raw.overall, DEFAULT_READINESS.overall),
    criticalWeaknesses: weaknesses.slice(0, 5).map((item) => {
      const record = asRecord(item);
      return {
        competency: isCompKey(record.competency) ? record.competency : 'academic',
        issue: toText(record.issue, '구체적인 보완점 확인 필요'),
        evidence: toText(record.evidence, '생기부 원문 근거 확인 필요'),
        recommendation: toText(record.recommendation, '후속 상담에서 보완 활동을 구체화하세요.'),
      };
    }),
    nextActions: actions.slice(0, 5).map((item, idx) => {
      const record = asRecord(item);
      return {
        priority: normalizePriority(record.priority, idx + 1),
        action: toText(record.action, '후속 상담 액션을 정리하세요.'),
        linkedService: normalizeLinkedService(record.linkedService),
        reason: toText(record.reason, '생기부 분석 결과와 연결되는 후속 조치입니다.'),
      };
    }),
    reliability: {
      confidence: normalizeConfidence(reliability.confidence),
      missingData: toStringArray(reliability.missingData),
      notes: toText(reliability.notes, DEFAULT_READINESS.reliability.notes),
    },
  };
}

export function calibrateSegibuScores(value: unknown): SegibuAnalysis['scores'] {
  const capped = {
    academic: Math.min(normalizeScores(value).academic, 88),
    career: Math.min(normalizeScores(value).career, 88),
    community: Math.min(normalizeScores(value).community, 88),
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

export function normalizeSegibuAnalysis(value: unknown): SegibuAnalysis | null {
  const raw = asRecord(value);
  if (!raw.report && !raw.structuredData && !raw.highlights && !raw.scores) return null;
  const highlights = asRecord(raw.highlights);
  const structuredData = asRecord(raw.structuredData);

  return {
    ...raw,
    report: toText(raw.report),
    scores: normalizeScores(raw.scores),
    grades: normalizeGrades(raw.grades),
    groupAverages: normalizeGroupAverages(raw.groupAverages),
    summaryHighlights: normalizeSummaryHighlights(raw.summaryHighlights),
    futureStrategy: normalizeFutureStrategy(raw.futureStrategy),
    admissionsReadiness: normalizeReadiness(raw.admissionsReadiness),
    highlights: {
      changche: normalizeHighlightGroups(asRecord(highlights).changche, CHANGCHE_KEYS),
      curriculum: normalizeHighlightGroups(asRecord(highlights).curriculum, CURRICULUM_KEYS),
      behavior: normalizeYearHighlights(asRecord(highlights).behavior),
    },
    structuredData: {
      changche: normalizeDataGroups(asRecord(structuredData).changche, CHANGCHE_KEYS),
      curriculum: normalizeDataGroups(asRecord(structuredData).curriculum, CURRICULUM_KEYS),
      behavior: normalizeYearData(asRecord(structuredData).behavior),
    },
    studentName: toOptionalText(raw.studentName),
    school: toOptionalText(raw.school),
    grade: toOptionalText(raw.grade),
    targetDept: toOptionalText(raw.targetDept),
  } as SegibuAnalysis;
}
