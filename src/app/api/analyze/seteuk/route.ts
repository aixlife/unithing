import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Step 2: 탐구 주제 3개 추천
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject') ?? '';
  const major = searchParams.get('major') ?? '';

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash' });

  const prompt = `학생 정보: 희망학과=${major}, 과목=${subject}

위 학생에게 맞는 고등학교 세특(세부능력 및 특기사항) 탐구 주제 3개를 JSON으로 추천해줘.
주제는 실제 고등학교 수준에서 탐구 가능하고, 희망 학과와 연관성이 명확해야 해.
코드블록 없이 JSON 배열만 출력:
[
  { "title": "주제명(30자이내)", "tags": ["태그1","태그2","태그3"], "fit": 적합도(0-100) },
  { "title": "주제명", "tags": [...], "fit": 숫자 },
  { "title": "주제명", "tags": [...], "fit": 숫자 }
]`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const json = raw.startsWith('[') ? raw : raw.replace(/^```json?\s*/, '').replace(/```\s*$/, '');
    return Response.json(JSON.parse(json));
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// Step 5+6: 세특 초안 + 탐구계획서 생성
export async function POST(req: Request) {
  const { subject, major, topic, motivation, competencies } = await req.json();

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    systemInstruction: `나는 교사야, 너와 함께 세특을 쓰고 싶어. 학생의 결과물과 나의 평가를 바탕으로 세특을 적어줘.
학생의 역량과 근거, 그리고 구체적인 스토리를 담아줘. 학생이 주도적으로 탐구한 과정이 드러나야 해.
교사가 관찰한 시점으로 서술하고, 수동적 참여가 아닌 능동적 탐구 행동을 강조해.`,
  });

  const prompt = `다음 정보를 바탕으로 세특 초안과 탐구계획서를 JSON으로 작성해줘.
코드블록 없이 JSON만 출력.

학생 정보:
- 과목: ${subject}
- 희망학과: ${major}
- 탐구주제: ${topic}
- 탐구동기: ${motivation}
- 연결역량: ${competencies}

JSON 형식:
{
  "draft": "세특 문장 초안 (450자 내외, 교사 관찰 시점, 학생의 탐구 과정·결과·역량이 구체적으로 드러나게)",
  "plan": {
    "subject": "${subject}",
    "topic": "${topic}",
    "motivation": "탐구 동기 한 문장 (40자이내)",
    "method": "탐구 방법 3가지 (번호 매겨서)",
    "output": "예상 결과물 (보고서, 발표 등)",
    "competencies": ["역량1", "역량2", "역량3"]
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const json = raw.startsWith('{') ? raw : raw.replace(/^```json?\s*/, '').replace(/```\s*$/, '');
    return Response.json(JSON.parse(json));
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
