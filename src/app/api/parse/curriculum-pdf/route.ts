import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkAiQuota } from '@/lib/aiUsage';

type ParsedGroup = {
  grade: number;
  semester: string;
  credits: number;
  selectCount: number;
  subjects: string[];
};

const MANDATORY_KEYS = ['2-1', '2-2', '3-1', '3-2'] as const;
const MAX_CURRICULUM_PDF_BYTES = 4 * 1024 * 1024;

export const runtime = 'nodejs';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeSubjects(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeSemester(value: unknown) {
  const semester = String(value ?? '1·2학기').trim();
  if (semester.includes('1') && semester.includes('2')) return '1·2학기';
  if (semester.includes('2')) return '2학기';
  return '1학기';
}

function normalizeParsed(value: unknown) {
  const raw = asRecord(value);
  const mandatoryRaw = asRecord(raw.mandatory);
  const mandatory = MANDATORY_KEYS.reduce<Record<(typeof MANDATORY_KEYS)[number], string[]>>((acc, key) => {
    acc[key] = normalizeSubjects(mandatoryRaw[key]);
    return acc;
  }, { '2-1': [], '2-2': [], '3-1': [], '3-2': [] });

  const groups = Array.isArray(raw.groups) ? raw.groups : [];
  const normalizedGroups = groups.flatMap<ParsedGroup>((item) => {
    const group = asRecord(item);
    const subjects = normalizeSubjects(group.subjects);
    if (subjects.length === 0) return [];
    const grade = Number(group.grade);
    const credits = Number(group.credits);
    const selectCount = Number(group.selectCount);
    return [{
      grade: grade === 3 ? 3 : 2,
      semester: normalizeSemester(group.semester),
      credits: Number.isFinite(credits) && credits > 0 ? credits : 4,
      selectCount: Number.isFinite(selectCount) && selectCount > 0 ? selectCount : 1,
      subjects,
    }];
  });

  return {
    mandatory,
    groups: normalizedGroups.slice(0, 20),
    notes: normalizeSubjects(raw.notes).slice(0, 6),
  };
}

function extractJson(text: string) {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const teacherId = (session?.user as { teacherId?: string } | undefined)?.teacherId;
  if (!teacherId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: 'PDF 업로드 요청을 읽지 못했습니다. 파일 용량과 형식을 확인해 주세요.' }, { status: 400 });
  }
  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ error: '파일이 없습니다.' }, { status: 400 });
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return Response.json({ error: 'PDF 파일만 추출할 수 있습니다.' }, { status: 400 });
  if (file.size > MAX_CURRICULUM_PDF_BYTES) return Response.json({ error: 'PDF는 4MB 이하만 추출할 수 있습니다.' }, { status: 400 });

  const quota = checkAiQuota('subjects', teacherId);
  if (!quota.ok) return Response.json({ error: quota.error, limit: quota.limit, remaining: quota.remaining }, { status: quota.status });

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: 'GEMINI_API_KEY가 설정되어 있지 않습니다.' }, { status: 500 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const prompt = `학교 교육과정 편제표 PDF에서 2~3학년 선택과목 입력에 필요한 값만 추출해줘.
현재 MVP는 제공된 대표 양식 1종을 기준으로 한다.

코드블록 없이 JSON만 출력:
{
  "mandatory": {
    "2-1": ["필수과목명"],
    "2-2": ["필수과목명"],
    "3-1": ["필수과목명"],
    "3-2": ["필수과목명"]
  },
  "groups": [
    {
      "grade": 2,
      "semester": "1학기|2학기|1·2학기",
      "credits": 4,
      "selectCount": 1,
      "subjects": ["과목명"]
    }
  ],
  "notes": ["검수자가 확인해야 할 점"]
}

추출 기준:
- 과목명, 학점, 학년, 학기, 택N을 우선 추출한다.
- 공통/일반/진로/융합 구분은 notes에만 남기고 groups에는 넣지 않는다.
- 미적분Ⅰ/미적분1, 영어Ⅰ/영어1처럼 로마자와 숫자 표기는 원문에 가까운 과목명으로 통일한다.
- 확신이 낮은 행은 누락하지 말고 groups에 넣은 뒤 notes에 확인 필요라고 남긴다.
- 학생 개인정보가 아닌 학교 공개 편제표만 다룬다.`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
          { text: prompt },
        ],
      }],
    });
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(extractJson(result.response.text()));
    } catch {
      return Response.json({
        error: '교육과정 편제표 추출 결과 형식이 올바르지 않습니다.',
        detail: 'AI 응답을 JSON으로 변환하지 못했습니다. 같은 파일을 자동 재시도하지 말고, 필요하면 직접 입력하거나 파일을 단순화해 다시 업로드하세요.',
      }, { status: 502 });
    }
    const parsed = normalizeParsed(parsedJson);
    if (parsed.groups.length === 0 && Object.values(parsed.mandatory).every((subjects) => subjects.length === 0)) {
      return Response.json({
        error: '편제표에서 과목을 찾지 못했습니다.',
        detail: '스캔 이미지가 흐리거나 표 구조가 대표 양식과 다를 수 있습니다. 과목명을 직접 입력하거나 더 선명한 PDF로 다시 시도하세요.',
      }, { status: 422 });
    }
    return Response.json(parsed);
  } catch (error) {
    return Response.json({
      error: '교육과정 편제표를 추출하지 못했습니다.',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
