'use client';

import { useState, useCallback } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary: '#1B64DA',
  primarySoft: '#EBF2FF',
  primaryBorder: '#CFDFFB',
  accent: '#D97706',
  accentSoft: '#FEF3C7',
  success: '#059669',
  successSoft: '#D1FAE5',
  bg: '#F4F6F8',
  bgAlt: '#EFF1F4',
  surface: '#FFFFFF',
  border: '#E5E8EB',
  borderStrong: '#D1D6DB',
  text: '#191F28',
  textMuted: '#4E5968',
  textSubtle: '#8B95A1',
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
type YearKey = '1' | '2' | '3';
type BadgeType = '도전' | '적정' | '안정';

interface University {
  name: string;
  dept: string;
  process: string;
  type: string;
  grade: number;
  badge: BadgeType;
}

interface SubjectRow {
  name: string;
}


const SUBJECTS_BY_YEAR: Record<YearKey, SubjectRow[]> = {
  '1': [
    { name: '국어' },
    { name: '수학' },
    { name: '영어' },
    { name: '사회' },
    { name: '과학' },
  ],
  '2': [
    { name: '국어' },
    { name: '수학' },
    { name: '영어' },
    { name: '한국사' },
    { name: '생명과학Ⅰ' },
  ],
  '3': [
    { name: '국어' },
    { name: '수학' },
    { name: '영어' },
    { name: '화학Ⅱ' },
    { name: '생명과학Ⅱ' },
  ],
};

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

// ─── Badge config helpers ─────────────────────────────────────────────────────
function getBadgeConfig(badge: BadgeType) {
  if (badge === '도전') return { bg: T.accentSoft, color: T.accent, stripe: T.accent };
  if (badge === '적정') return { bg: T.primarySoft, color: T.primary, stripe: T.primary };
  return { bg: T.successSoft, color: T.success, stripe: T.success };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SummaryBadge({ label, count, badge }: { label: string; count: number; badge: BadgeType }) {
  const cfg = getBadgeConfig(badge);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 16, fontWeight: 700,
    }}>
      {label} {count}개
    </div>
  );
}

function UniversityCard({ univ }: { univ: University }) {
  const [hovered, setHovered] = useState(false);
  const cfg = getBadgeConfig(univ.badge);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'stretch',
        background: T.surface, borderRadius: 12,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <div style={{ width: 4, flexShrink: 0, background: cfg.stripe }} />
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>{univ.name}</span>
            <span style={{ fontSize: 14, color: T.textMuted, fontWeight: 500 }}>{univ.dept}</span>
          </div>
          <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 3 }}>{univ.type} · {univ.process}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textSubtle, fontWeight: 500, marginBottom: 2 }}>입결등급</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{univ.grade.toFixed(2)}</div>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontSize: 14, fontWeight: 700 }}>
            {univ.badge}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Service1Grade() {
  const [activeYear, setActiveYear] = useState<YearKey>('1');
  const [grades, setGrades] = useState<Record<YearKey, Record<string, string>>>({
    '1': {},
    '2': {},
    '3': {},
  });
  const [keyword, setKeyword] = useState('');
  const [admType, setAdmType] = useState<'all' | '교과' | '종합'>('all');
  const [results, setResults] = useState<University[]>([]);
  const [counts, setCounts] = useState({ 도전: 0, 적정: 0, 안정: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleGradeChange = (year: YearKey, subject: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [year]: { ...prev[year], [subject]: value },
    }));
  };

  const calcAvg = useCallback(() => {
    const all: number[] = [];
    (['1', '2', '3'] as YearKey[]).forEach(y => {
      Object.values(grades[y]).forEach(v => {
        if (v) all.push(parseInt(v));
      });
    });
    if (all.length === 0) return null;
    return all.reduce((a, b) => a + b, 0) / all.length;
  }, [grades]);

  const handleSearch = useCallback(async () => {
    const avg = calcAvg();
    if (!avg) {
      setError('최소 한 과목의 등급을 입력해주세요.');
      return;
    }
    setLoading(true); setError(null); setSearched(true);
    try {
      const params = new URLSearchParams({
        grade: avg.toFixed(2),
        keyword,
        type: admType,
        limit: '60',
      });
      const res = await fetch(`/api/universities?${params}`);
      if (!res.ok) throw new Error('검색 실패');
      const data = await res.json();
      setResults(data.results);
      setCounts(data.counts);
      setTotal(data.total);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [calcAvg, keyword, admType]);

  const avg = calcAvg();
  const badgeCounts = searched ? counts : { 도전: 0, 적정: 0, 안정: 0 };

  return (
    <div style={{ fontFamily: FONT, color: T.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Instruction */}
      <div style={{
        padding: '16px 20px', background: T.primarySoft,
        border: `1px solid ${T.primaryBorder}`, borderRadius: 12,
        fontSize: 17, color: T.primary, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={T.primary} strokeWidth="1.5"/>
          <path d="M8 7v5M8 5v.5" stroke={T.primary} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        내신 등급을 입력하고 적정 대학을 찾아보세요
      </div>

      {/* Grade input card */}
      <div style={{
        background: T.surface, borderRadius: 16,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}>
        {/* Year tabs */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${T.border}`,
          background: T.bg,
        }}>
          {(['1', '2', '3'] as YearKey[]).map(year => (
            <button
              key={year}
              onClick={() => setActiveYear(year)}
              style={{
                flex: 1, padding: '14px 0',
                background: activeYear === year ? T.surface : 'transparent',
                border: 'none', borderBottom: activeYear === year ? `2px solid ${T.primary}` : '2px solid transparent',
                color: activeYear === year ? T.primary : T.textMuted,
                fontSize: 17, fontWeight: activeYear === year ? 700 : 500,
                cursor: 'pointer', fontFamily: FONT,
                transition: 'color 0.12s, border-color 0.12s',
              }}
            >
              {year}학년
            </button>
          ))}
        </div>

        {/* Subject table */}
        <div style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left', padding: '8px 12px',
                  fontSize: 15, fontWeight: 600, color: T.textSubtle,
                  borderBottom: `1px solid ${T.border}`,
                }}>과목</th>
                <th style={{
                  textAlign: 'right', padding: '8px 12px',
                  fontSize: 15, fontWeight: 600, color: T.textSubtle,
                  borderBottom: `1px solid ${T.border}`,
                }}>등급</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECTS_BY_YEAR[activeYear].map((subj, idx) => (
                <tr key={subj.name} style={{ background: idx % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{
                    padding: '12px 12px', fontSize: 17,
                    fontWeight: 500, color: T.text,
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    {subj.name}
                  </td>
                  <td style={{
                    padding: '10px 12px', textAlign: 'right',
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    <select
                      value={grades[activeYear][subj.name] ?? ''}
                      onChange={e => handleGradeChange(activeYear, subj.name, e.target.value)}
                      style={{
                        padding: '6px 28px 6px 10px', fontSize: 17,
                        fontFamily: FONT, fontWeight: 600, color: T.text,
                        background: T.surface, border: `1px solid ${T.borderStrong}`,
                        borderRadius: 8, cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238B95A1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        minWidth: 80,
                      }}
                    >
                      <option value="">선택</option>
                      {GRADES.map(g => (
                        <option key={g} value={g}>{g}등급</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Filters + CTA */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 키워드 + 전형 필터 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="대학명 또는 학과 검색 (선택)"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1, minWidth: 160, padding: '8px 12px',
                fontSize: 14, fontFamily: FONT, color: T.text,
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 8, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {(['all', '교과', '종합'] as const).map(t => (
                <button key={t} onClick={() => setAdmType(t)}
                  style={{
                    padding: '8px 14px', fontSize: 13, fontFamily: FONT, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: admType === t ? T.primary : 'transparent',
                    color: admType === t ? '#fff' : T.textMuted,
                    transition: 'background 0.12s',
                  }}>
                  {t === 'all' ? '전체' : t}
                </button>
              ))}
            </div>
          </div>

          {avg && (
            <div style={{ fontSize: 13, color: T.textSubtle }}>
              입력 평균등급: <strong style={{ color: T.primary }}>{avg.toFixed(2)}등급</strong>
            </div>
          )}

          {error && <div style={{ fontSize: 13, color: '#dc2626' }}>{error}</div>}

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              width: '100%', padding: '14px 0',
              background: loading ? T.borderStrong : T.primary, color: '#fff',
              fontSize: 15, fontWeight: 700, fontFamily: FONT,
              border: 'none', borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.02em', transition: 'opacity 0.12s',
            }}
          >
            {loading ? '검색 중...' : '대학 찾기'}
          </button>
        </div>
      </div>

      {/* Results section */}
      {searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', fontFamily: FONT }}>
              적정 대학 목록
              {total > 60 && <span style={{ fontSize: 13, fontWeight: 400, color: T.textSubtle, marginLeft: 8 }}>전체 {total}개 중 60개 표시</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <SummaryBadge label="도전" count={badgeCounts.도전} badge="도전" />
              <SummaryBadge label="적정" count={badgeCounts.적정} badge="적정" />
              <SummaryBadge label="안정" count={badgeCounts.안정} badge="안정" />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: T.textSubtle, fontSize: 15 }}>검색 중...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: T.textSubtle, fontSize: 15 }}>
              조건에 맞는 대학이 없습니다. 등급 범위를 조정해보세요.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
              {results.map((univ, i) => (
                <UniversityCard key={`${univ.name}-${univ.dept}-${i}`} univ={univ} />
              ))}
            </div>
          )}

          <p style={{ fontSize: 13, color: T.textSubtle, textAlign: 'center', margin: 0 }}>
            * 2025학년도 어디가 입결 데이터 기준. 실제 입시 결과와 다를 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
