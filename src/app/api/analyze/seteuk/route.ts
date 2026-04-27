import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getModel(system?: string) {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    ...(system ? { systemInstruction: system } : {}),
  });
}

async function gen(prompt: string, system?: string): Promise<string> {
  const result = await getModel(system).generateContent(prompt);
  const raw = result.response.text().trim();
  return raw.replace(/^```json?\s*/, '').replace(/```\s*$/, '');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'topics';

  try {
    if (action === 'topics') {
      const major = searchParams.get('major') ?? '';
      const interest = searchParams.get('interest') ?? '';
      const activities = searchParams.get('activities') ?? '';
      const json = await gen(
        `희망 학과: ${major}\n관심 주제/호기심: ${interest}\n기존 활동: ${activities}\n\n위 정보를 바탕으로 고등학생 수준의 심화 탐구 주제 3가지를 추천해줘.\n코드블록 없이 JSON만 출력:\n{"topics":[{"title":"주제명","description":"간략한 설명 및 탐구 방향성"},...]}`
      );
      return Response.json(JSON.parse(json));
    }

    if (action === 'motivations') {
      const topic = searchParams.get('topic') ?? '';
      const json = await gen(
        `확정된 탐구 주제: ${topic}\n\n이 주제를 선정한 '동기'를 학생부 기록에 활용할 수 있도록 다음 3가지 유형으로 구체화해서 제시해줘.\n코드블록 없이 JSON만 출력:\n{"motivations":[{"type":"교과 수업 연계","content":"내용"},{"type":"시사 문제 연계","content":"내용"},{"type":"독서/실생활 연계","content":"내용"}]}`
      );
      return Response.json(JSON.parse(json));
    }

    if (action === 'competencies') {
      const topic = searchParams.get('topic') ?? '';
      const json = await gen(
        `탐구 주제: ${topic}\n\n이 탐구 활동을 통해 학생이 드러낼 수 있는 핵심 역량(예: 학업역량, 탐구력, 문제해결력, 융합적 사고력 등)을 구체적인 행동 특성과 연결하여 3~4가지 제시해줘.\n코드블록 없이 JSON만 출력:\n{"competencies":[{"name":"역량명","behavior":"구체적인 행동 특성"}]}`
      );
      return Response.json(JSON.parse(json));
    }

    if (action === 'followups') {
      const topic = searchParams.get('topic') ?? '';
      const json = await gen(
        `탐구 주제: ${topic}\n\n활동 이후 추가로 호기심을 확장할 수 있는 후속 활동을 제시해줘.\n심화탐구형, 사례분석형, 비교분석형, 심화 독서형, 실생활 적용형 중 3가지 이상의 구체적인 후속 활동 사례를 제시해줘.\n코드블록 없이 JSON만 출력:\n{"followUps":[{"type":"활동 유형","content":"구체적인 활동 내용"}]}`
      );
      return Response.json(JSON.parse(json));
    }

    return Response.json({ error: '알 수 없는 action' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { major, interest, topic, motivation, competencies, followUp } = await req.json();
  const compStr = Array.isArray(competencies) ? competencies.join('\n') : competencies;

  const system = `나는 교사야, 너와 함께 세특을 쓰고 싶어. 학생의 결과물과 나의 평가를 바탕으로 세특을 적어줘.
학생의 역량과 근거, 그리고 구체적인 스토리를 담아줘. 학생이 주도적으로 탐구한 과정이 드러나야 해.
교사가 관찰한 시점으로 서술하고, 수동적 참여가 아닌 능동적 탐구 행동을 강조해.`;

  const planPrompt = `다음 정보를 바탕으로 체계적인 탐구 계획서를 완성해줘.
코드블록 없이 JSON만 출력:
{
  "plan": [
    { "category": "주제", "content": "구체적 주제" },
    { "category": "주제 개요", "content": "전반적인 개요" },
    { "category": "주제 선정의 이유\\n(동기)", "content": "선택한 동기 구체화" },
    {
      "category": "탐구 방법\\n(서울대형 7단계 프레임)",
      "isStepByStep": true,
      "steps": [
        { "step": "STEP 1", "title": "문제 인식", "description": "어떤 현상에 주목했는가?" },
        { "step": "STEP 2", "title": "개념 정의 기반 이해", "description": "교과 지식을 어떻게 적용했는가?" },
        { "step": "STEP 3", "title": "탐구·모델링 과정", "description": "어떤 방식으로 구조화했는가?" },
        { "step": "STEP 4", "title": "실험·자료 분석", "description": "데이터를 어떻게 다루었는가?" },
        { "step": "STEP 5", "title": "논리적 해석", "description": "결과에서 어떤 의미를 도출했는가?" },
        { "step": "STEP 6", "title": "전공·사회 확장", "description": "이 지식을 어디로 연결했는가?" },
        { "step": "STEP 7", "title": "성찰·개선", "description": "무엇을 깨닫고, 다음 단계는 무엇인가?" }
      ]
    },
    { "category": "탐구 내용", "content": "주제에 대한 구체적인 탐구 전개 내용" },
    { "category": "예상 결과", "content": "도출될 것으로 기대되는 결과" },
    { "category": "함양하게 된 역량", "content": "선택한 역량 구체화" },
    { "category": "후속활동", "content": "선택한 후속 활동 구체화" }
  ]
}

[탐구 방법 작성 지침]
주제에 따라 특정 단계가 부자연스럽다면 해당 단계는 제외하고 자연스러운 흐름으로 최대 7단계까지 구성해줘.
각 단계의 description은 학생이 실제로 수행할 수 있는 구체적인 활동으로 작성해줘.

[정보]
- 희망 학과: ${major}
- 관심 주제/호기심: ${interest}
- 탐구 주제: ${topic}
- 탐구 동기: ${motivation}
- 핵심 역량: ${compStr}
- 후속활동: ${followUp}`;

  const seTeukPrompt = `다음 정보를 바탕으로 1000 byte 이내의 교사 관점 세특 개요를 작성해줘.
특히 '탐구 방법(서울대형 7단계 프레임)'의 구체적인 과정이 문장에 잘 녹아나도록 작성하는 것이 핵심이야.

[정보]
- 희망 학과: ${major}
- 관심 주제/호기심: ${interest}
- 탐구 주제: ${topic}
- 탐구 동기: ${motivation}
- 핵심 역량: ${compStr}
- 후속 활동: ${followUp}

[작성 세부 지침]
1. 구조: [탐구 동기] -> [구체적인 탐구 과정(7단계 프레임 반영)] -> [결과 및 교사의 관찰 내용] -> [핵심 역량] -> [탐구 후속활동] 순으로 유기적으로 연결.
2. 과정 중심 서술: 어떤 문제를 인식하고 어떤 개념을 적용하여 어떻게 모델링/분석했는지 구체적인 How가 드러나게 작성.
3. 어투 및 주어: 교사의 입장에서 관찰한 형태. 주어(학생은, 이 학생은) 생략. 종결형 어미는 명사형(~임, ~함). 현재형으로 작성.
4. 금지어: 네이버/구글/다음->포탈사이트, 유튜브->동영상 공유 플랫폼, Chat GPT->생성형 인공지능.
5. 중요: 반드시 줄 바꿈 없이 하나의 단락으로만 작성해줘.`;

  try {
    const model = getModel(system);
    const [planResult, seTeukResult] = await Promise.all([
      model.generateContent(planPrompt),
      model.generateContent(seTeukPrompt),
    ]);

    const planRaw = planResult.response.text().trim().replace(/^```json?\s*/, '').replace(/```\s*$/, '');
    const plan = JSON.parse(planRaw);
    const draft = seTeukResult.response.text().trim();

    return Response.json({ draft, plan });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
