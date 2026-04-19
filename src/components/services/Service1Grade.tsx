'use client';

import { useState } from 'react';

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
  cut70: number;
  cut50: number;
  badge: BadgeType;
}

interface SubjectRow {
  name: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_UNIVERSITIES: University[] = [
  { name: '서울대', dept: '의예과', cut70: 1.38, cut50: 1.12, badge: '도전' },
  { name: '연세대', dept: '의예과', cut70: 1.52, cut50: 1.28, badge: '도전' },
  { name: '고려대', dept: '의과대학', cut70: 1.61, cut50: 1.38, badge: '도전' },
  { name: '성균관대', dept: '의예과', cut70: 1.74, cut50: 1.52, badge: '적정' },
  { name: '한양대', dept: '의예과', cut70: 1.85, cut50: 1.63, badge: '적정' },
  { name: '경희대', dept: '의예과', cut70: 1.92, cut50: 1.71, badge: '적정' },
  { name: '인하대', dept: '의예과', cut70: 2.14, cut50: 1.94, badge: '안정' },
  { name: '아주대', dept: '의예과', cut70: 2.28, cut50: 2.07, badge: '안정' },
];

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
        boxShadow: hovered
          ? '0 6px 20px rgba(0,0,0,0.10)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      {/* Left accent stripe */}
      <div style={{ width: 4, flexShrink: 0, background: cfg.stripe }} />

      {/* Content */}
      <div style={{
        flex: 1, padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        {/* Name + dept */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
              {univ.name}
            </span>
            <span style={{ fontSize: 16, color: T.textMuted, fontWeight: 500 }}>
              {univ.dept}
            </span>
          </div>
        </div>

        {/* Right: cut scores + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: T.textSubtle, fontWeight: 500, marginBottom: 2 }}>70%컷</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{univ.cut70.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: T.textSubtle, fontWeight: 500, marginBottom: 2 }}>50%컷</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{univ.cut50.toFixed(2)}</div>
            </div>
          </div>

          {/* Badge */}
          <div style={{
            padding: '4px 10px', borderRadius: 6,
            background: cfg.bg, color: cfg.color,
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
          }}>
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
  const [showResults] = useState(true); // Show mock results by default

  const handleGradeChange = (year: YearKey, subject: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [year]: { ...prev[year], [subject]: value },
    }));
  };

  const badgeCounts = {
    도전: MOCK_UNIVERSITIES.filter(u => u.badge === '도전').length,
    적정: MOCK_UNIVERSITIES.filter(u => u.badge === '적정').length,
    안정: MOCK_UNIVERSITIES.filter(u => u.badge === '안정').length,
  };

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

        {/* CTA button */}
        <div style={{ padding: '0 20px 20px' }}>
          <button
            style={{
              width: '100%', padding: '14px 0',
              background: T.primary, color: '#fff',
              fontSize: 15, fontWeight: 700, fontFamily: FONT,
              border: 'none', borderRadius: 10, cursor: 'pointer',
              letterSpacing: '-0.02em',
              transition: 'opacity 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            대학 찾기
          </button>
        </div>
      </div>

      {/* Results section */}
      {showResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Results header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', fontFamily: FONT }}>
              적정 대학 목록
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <SummaryBadge label="도전" count={badgeCounts.도전} badge="도전" />
              <SummaryBadge label="적정" count={badgeCounts.적정} badge="적정" />
              <SummaryBadge label="안정" count={badgeCounts.안정} badge="안정" />
            </div>
          </div>

          {/* Column labels */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 16,
            paddingRight: 60, paddingLeft: 16,
          }}>
            <span style={{ fontSize: 14, color: T.textSubtle, fontWeight: 500, width: 42, textAlign: 'center' }}>70%컷</span>
            <span style={{ fontSize: 14, color: T.textSubtle, fontWeight: 500, width: 42, textAlign: 'center' }}>50%컷</span>
          </div>

          {/* University cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
            {MOCK_UNIVERSITIES.map(univ => (
              <UniversityCard key={`${univ.name}-${univ.dept}`} univ={univ} />
            ))}
          </div>

          <p style={{ fontSize: 15, color: T.textSubtle, textAlign: 'center', margin: 0 }}>
            * 표시된 데이터는 예시이며, 실제 입시 결과와 다를 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
