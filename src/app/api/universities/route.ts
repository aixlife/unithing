import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

interface RawEntry {
  n: string; // 대학명
  t: string; // 전형종류 (교과/종합)
  p: string; // 전형명
  d: string; // 모집단위
  g: number; // 등급
}

interface UnivResult {
  name: string;
  dept: string;
  process: string;
  type: string;
  grade: number;
  badge: '도전' | '적정' | '안정';
}

let cache: RawEntry[] | null = null;

function loadData(): RawEntry[] {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), 'src/data/universitiesRaw.json');
  cache = JSON.parse(readFileSync(filePath, 'utf-8')) as RawEntry[];
  return cache;
}

function getBadge(userGrade: number, cutoff: number): '도전' | '적정' | '안정' {
  const diff = cutoff - userGrade; // positive = cutoff is higher (safer for user)
  if (diff < -0.4) return '도전';  // school is significantly harder
  if (diff > 0.5) return '안정';   // school is significantly easier
  return '적정';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const gradeStr = searchParams.get('grade');
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const type = searchParams.get('type') ?? 'all'; // 교과 | 종합 | all
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '60'), 200);

  if (!gradeStr) {
    return NextResponse.json({ error: 'grade 파라미터가 필요합니다.' }, { status: 400 });
  }

  const userGrade = parseFloat(gradeStr);
  if (isNaN(userGrade) || userGrade < 1 || userGrade > 9) {
    return NextResponse.json({ error: '등급은 1~9 사이여야 합니다.' }, { status: 400 });
  }

  const data = loadData();

  // 필터링
  const RANGE = 1.5; // ±1.5 등급 범위 내 결과만
  const filtered = data.filter(r => {
    if (type !== 'all' && r.t !== type) return false;
    if (keyword && !r.n.includes(keyword) && !r.d.includes(keyword) && !r.p.includes(keyword)) return false;
    return Math.abs(r.g - userGrade) <= RANGE;
  });

  // 등급 근접도 기준 정렬
  filtered.sort((a, b) => Math.abs(a.g - userGrade) - Math.abs(b.g - userGrade));

  const results: UnivResult[] = filtered.slice(0, limit).map(r => ({
    name: r.n,
    dept: r.d,
    process: r.p,
    type: r.t,
    grade: r.g,
    badge: getBadge(userGrade, r.g),
  }));

  const counts = {
    도전: results.filter(r => r.badge === '도전').length,
    적정: results.filter(r => r.badge === '적정').length,
    안정: results.filter(r => r.badge === '안정').length,
  };

  return NextResponse.json({ results, counts, total: filtered.length });
}
