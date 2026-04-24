import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

interface RawEntry {
  n: string;
  t: string;
  p: string;
  d: string;
  g: number;
}

export interface UnivResult {
  name: string;
  dept: string;
  process: string;
  type: string;
  grade: number;
  badge: '도전' | '적정' | '안정';
  category: string;
}

let cache: RawEntry[] | null = null;

function loadData(): RawEntry[] {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), 'src/data/universitiesRaw.json');
  cache = JSON.parse(readFileSync(filePath, 'utf-8')) as RawEntry[];
  return cache;
}

function getBadge(userGrade: number, cutoff: number): '도전' | '적정' | '안정' {
  const diff = cutoff - userGrade;
  if (diff < -0.4) return '도전';
  if (diff > 0.5) return '안정';
  return '적정';
}

function getCategory(dept: string): string {
  if (['교육', '사범'].some(k => dept.includes(k))) return '교육';
  if (['의예', '치의예', '한의예', '약학', '간호', '임상병리', '방사선', '물리치료', '작업치료', '치위생', '응급구조', '수의예', '의학', '한약', '의료', '치기공', '보건'].some(k => dept.includes(k))) return '의약';
  if (['전자', '컴퓨터', '기계', '신소재', '건축', '에너지', '토목', '환경', '산업', '소프트웨어', '인공지능', '로봇', '반도체', '자동차', '화학공학', '고분자', '시스템', '전기', '정보', '공학', 'AI', '데이터', '융합기술', '드론', '메카'].some(k => dept.includes(k))) return '공학';
  if (['수학', '물리', '화학', '생물', '천문', '지질', '해양', '통계', '의생명', '생명과학', '과학', '나노', '식품', '원예', '산림', '조경', '생명'].some(k => dept.includes(k))) return '자연';
  if (['경영', '경제', '법학', '행정', '미디어', '사회복지', '심리', '정치', '외교', '무역', '회계', '관광', '언론', '아동', '소비자', '지리', '사회', '광고', '홍보', '금융', '부동산', '세무', '국제', '커뮤니케이션'].some(k => dept.includes(k))) return '사회';
  if (['인문', '어문', '역사', '철학', '종교', '국어', '영어', '독어', '불어', '일어', '중어', '한문', '사학', '고고', '미학', '문학', '언어', '신학', '창작', '문화'].some(k => dept.includes(k))) return '인문';
  return '기타';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gradeStr = searchParams.get('grade');
  const rangeStr = searchParams.get('range') ?? '2.0';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500);

  if (!gradeStr) {
    return NextResponse.json({ error: 'grade 파라미터가 필요합니다.' }, { status: 400 });
  }

  const userGrade = parseFloat(gradeStr);
  if (isNaN(userGrade) || userGrade < 1 || userGrade > 9) {
    return NextResponse.json({ error: '등급은 1~9 사이여야 합니다.' }, { status: 400 });
  }

  const range = Math.min(parseFloat(rangeStr) || 2.0, 4.0);
  const data = loadData();

  const filtered = data.filter(r => Math.abs(r.g - userGrade) <= range);

  // 도전/적정/안정 각 구간별로 균형 있게 샘플링
  const challenge = filtered.filter(r => r.g - userGrade < -0.4).sort((a, b) => b.g - a.g); // 가장 가까운 도전부터
  const fit       = filtered.filter(r => r.g - userGrade >= -0.4 && r.g - userGrade <= 0.5).sort((a, b) => Math.abs(a.g - userGrade) - Math.abs(b.g - userGrade));
  const safe      = filtered.filter(r => r.g - userGrade > 0.5).sort((a, b) => a.g - b.g); // 가장 가까운 안정부터

  const perZone = Math.floor(limit / 3);
  const balanced = [
    ...challenge.slice(0, perZone),
    ...fit.slice(0, perZone),
    ...safe.slice(0, limit - perZone * 2),
  ];

  const results: UnivResult[] = balanced.map(r => ({
    name: r.n,
    dept: r.d,
    process: r.p,
    type: r.t,
    grade: r.g,
    badge: getBadge(userGrade, r.g),
    category: getCategory(r.d),
  }));

  return NextResponse.json({ results, total: filtered.length });
}
