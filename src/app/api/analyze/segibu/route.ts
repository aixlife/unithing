import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `당신은 대한민국 고등학생 생활기록부(생기부) 분석 전문가입니다.
업로드된 생기부 PDF를 분석하여 아래 JSON 형식으로만 응답하세요. 코드블록(\`\`\`)이나 다른 텍스트를 포함하지 마세요.

{
  "studentName": "학생 이름 (없으면 '학생')",
  "school": "학교명 (없으면 '')",
  "grade": "학년 (예: 고3)",
  "targetDept": "희망 학과 (없으면 '')",
  "radar": [
    { "compKey": "academic", "value": 0~100 },
    { "compKey": "career", "value": 0~100 },
    { "compKey": "community", "value": 0~100 }
  ],
  "totalScore": 0~100,
  "percentile": "상위 X% 추정",
  "aiComment": "한 문장 종합 평가 (100자 이내)",
  "words": [{ "text": "키워드", "size": 12~36 }],
  "stats": { "subjectCount": 정수, "keywordCount": 정수 },
  "competencies": [
    { "compKey": "academic", "title": "학업역량", "score": 0~100, "items": ["서술1","서술2","서술3"] },
    { "compKey": "career", "title": "진로역량", "score": 0~100, "items": ["서술1","서술2"] },
    { "compKey": "community", "title": "공동체역량", "score": 0~100, "items": ["서술1","서술2"] }
  ],
  "activities": [
    {
      "name": "활동명(15자이내)", "type": "세특|봉사|동아리|독서|자율",
      "typeTone": "primary|success|accent|default",
      "subject": "관련 과목", "summary": "활동 요약(60자이내)",
      "eval": {
        "academic": { "score": 0~100, "stars": 1~5, "why": "평가이유(50자)", "fix": "보완점(50자)" },
        "career":   { "score": 0~100, "stars": 1~5, "why": "평가이유(50자)", "fix": "보완점(50자)" },
        "community":{ "score": 0~100, "stars": 1~5, "why": "평가이유(50자)", "fix": "보완점(50자)" }
      }
    }
  ],
  "yearlySubjects": {
    "1": [{ "name": "과목명", "score": "A+|A|B+|B|C+", "keyword": "세특키워드(20자이내)" }],
    "2": [...], "3": [...]
  },
  "reportSections": [
    { "num": 1, "title": "학업 성취", "compKey": "academic", "good": "강점(수치포함,70자)", "fix": "보완점(50자)" },
    { "num": 2, "title": "진로 일관성", "compKey": "career", "good": "강점(70자)", "fix": "보완점(50자)" },
    { "num": 3, "title": "공동체 활동", "compKey": "community", "good": "강점(70자)", "fix": "보완점(50자)" }
  ],
  "suggestions": [
    { "title": "제안제목(10자)", "desc": "구체적제안(25자)", "c": "academic|career|community" }
  ]
}

typeTone 규칙: 세특→primary, 봉사→success, 동아리→accent, 독서/자율→default
stars 규칙: 90~100→5, 75~89→4, 60~74→3, 45~59→2, 0~44→1
words는 15~20개, size는 중요도에 비례 (가장 중요한 키워드 36, 보통 18~22)
activities는 주요 활동 4~6개 선정`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return Response.json({ error: '파일이 없습니다' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: base64 } },
      '위 생기부를 분석하여 JSON으로 응답하세요.',
    ]);

    const raw = result.response.text().trim();
    const json = raw.startsWith('{') ? raw : raw.replace(/^```json?\s*/,'').replace(/```\s*$/,'');
    const analysis = JSON.parse(json);

    return Response.json(analysis);
  } catch (e) {
    console.error(e);
    return Response.json({ error: '분석 실패', detail: String(e) }, { status: 500 });
  }
}
