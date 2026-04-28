import { NextRequest, NextResponse } from 'next/server';
import rawRecords from '@/data/recommendedSubjectsRaw.json';
import type { UniversitySubjectRecord } from '@/types/subjects';

const RECORDS = rawRecords as UniversitySubjectRecord[];

function normalize(value: string) {
  return value.replace(/\s+/g, '').replace(/\(.*?\)/g, '').replace(/(학과|학부|전공|계열|대학)$/, '').toLowerCase();
}

function includesNormalized(source: string, query: string) {
  if (!query) return true;
  return normalize(source).includes(normalize(query));
}

function scoreRecord(record: UniversitySubjectRecord, university: string, major: string, q: string) {
  let score = 0;
  const normalizedUniversity = normalize(university);
  const normalizedMajor = normalize(major);
  const normalizedQ = normalize(q);

  if (normalizedUniversity) {
    if (normalize(record.university) === normalizedUniversity) score += 60;
    else if (normalize(record.university).includes(normalizedUniversity)) score += 35;
  }

  if (normalizedMajor) {
    if (normalize(record.major) === normalizedMajor) score += 70;
    else if (normalize(record.major).includes(normalizedMajor)) score += 45;
    else if (normalize(record.unit).includes(normalizedMajor)) score += 30;
  }

  if (normalizedQ) {
    const haystack = [record.region, record.location, record.university, record.college, record.major, record.core, record.recommended, record.note].join(' ');
    if (normalize(haystack).includes(normalizedQ)) score += 25;
  }

  score += Math.min(record.coreSubjects.length * 2, 10);
  score += Math.min(record.recommendedSubjects.length * 2, 10);
  return score;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const university = searchParams.get('university')?.trim() ?? '';
  const major = searchParams.get('major')?.trim() ?? '';
  const q = searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 30), 1), 100);

  const filtered = RECORDS
    .filter((record) => {
      if (university && !includesNormalized(record.university, university)) return false;
      if (major && !includesNormalized(record.major, major) && !includesNormalized(record.unit, major)) return false;
      if (q) {
        const haystack = [record.region, record.location, record.university, record.college, record.major, record.core, record.recommended, record.note].join(' ');
        if (!includesNormalized(haystack, q)) return false;
      }
      return true;
    })
    .map((record) => ({ record, score: scoreRecord(record, university, major, q) }))
    .sort((a, b) => b.score - a.score || a.record.university.localeCompare(b.record.university, 'ko') || a.record.major.localeCompare(b.record.major, 'ko'));

  return NextResponse.json({
    results: filtered.slice(0, limit).map(({ record }) => record),
    total: filtered.length,
    source: {
      name: '2028학년도 권역별 대학별 권장과목',
      rowCount: RECORDS.length,
      universities: new Set(RECORDS.map((record) => record.university)).size,
    },
  });
}
