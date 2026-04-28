'use client';

import { useState, useMemo, useCallback } from 'react';
import { ArrowRight, Save, X } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';
import type { ReadinessIssue } from '@/types/analysis';
import {
  TARGET_PICK_LABELS,
  TARGET_PICK_SLOTS,
  getNaesinData,
  getUniversityPicks,
  type NaesinData,
  type TargetPickSlot,
  type UniversityPicks,
  type UniversityTargetPick,
} from '@/types/student';

// ─── 5등급→9등급 환산 데이터 ──────────────────────────────────────────────────
type ConversionVersion = 'gyeonggi' | 'busan' | 'gwangju' | 'mixed';

const GYEONGGI = [
  [1.000,1.39],[1.083,1.53],[1.167,1.73],[1.250,1.87],[1.333,2.03],[1.417,2.18],
  [1.500,2.31],[1.583,2.45],[1.667,2.61],[1.750,2.73],[1.833,2.88],[1.917,3.00],
  [2.000,3.16],[2.083,3.28],[2.167,3.41],[2.250,3.54],[2.333,3.68],[2.417,3.80],
  [2.500,3.95],[2.583,4.08],[2.667,4.21],[2.750,4.34],[2.833,4.48],[2.917,4.61],
  [3.000,4.75],[3.083,4.87],[3.167,5.00],[3.250,5.12],[3.333,5.24],[3.417,5.33],
  [3.500,5.47],[3.583,5.59],[3.667,5.71],[3.750,5.83],[3.833,5.98],[3.917,6.09],
  [4.000,6.25],[4.083,6.36],[4.167,6.50],[4.250,6.61],[4.333,6.72],[4.417,6.81],
  [4.500,6.94],[4.583,7.05],[4.667,7.18],[4.750,7.30],[4.833,7.45],[4.917,7.62],
  [5.000,8.97],
];

const BUSAN = [
  [1.00,1.45],[1.08,1.59],[1.16,1.78],[1.24,1.98],[1.33,2.14],[1.42,2.32],
  [1.50,2.45],[1.66,2.72],[1.83,3.03],[2.00,3.35],[2.16,3.60],[2.33,3.91],
  [2.50,4.20],[2.66,4.46],[2.83,4.73],[3.00,5.03],[3.16,5.28],[3.33,5.58],
  [3.50,5.86],[3.66,6.08],[3.83,6.37],[4.00,6.67],[4.16,6.93],[4.33,7.20],
  [4.50,7.48],[4.66,7.71],[4.83,8.00],[5.00,9.00],
];

const GWANGJU = [
  [1.00,1.51],[1.15,1.78],[1.30,2.10],[1.45,2.38],[1.60,2.63],[1.75,2.89],
  [1.90,3.16],[2.05,3.45],[2.20,3.73],[2.35,3.97],[2.50,4.18],[2.65,4.42],
  [2.80,4.66],[2.95,4.95],[3.10,5.22],[3.25,5.44],[3.40,5.68],[3.55,5.92],
  [3.70,6.15],[3.85,6.38],[4.00,6.59],[4.15,6.87],[4.30,7.12],[4.45,7.44],
  [4.60,7.73],[5.00,9.00],
];

function interpolate(val: number, data: number[][]): number {
  if (val <= data[0][0]) return data[0][1];
  if (val >= data[data.length - 1][0]) return data[data.length - 1][1];
  for (let i = 0; i < data.length - 1; i++) {
    if (val >= data[i][0] && val <= data[i + 1][0]) {
      const t = (val - data[i][0]) / (data[i + 1][0] - data[i][0]);
      return data[i][1] + t * (data[i + 1][1] - data[i][1]);
    }
  }
  return val;
}

function convertGrade(grade5: number, version: ConversionVersion): { grade9: number; reason: string } {
  const g = interpolate(grade5, GYEONGGI);
  const b = interpolate(grade5, BUSAN);
  const gj = interpolate(grade5, GWANGJU);

  let grade9: number;
  let reason: string;
  if (version === 'gyeonggi') {
    grade9 = g;
    reason = `경기진학지도협의회 2025학년도 1학년 성적 분석 자료 기준으로 약 ${g.toFixed(3)} 등급으로 추정됩니다.`;
  } else if (version === 'busan') {
    grade9 = b;
    reason = `부산시 교육청 2025학년도 고1 1~2학기 등급평균 분석 자료 기준으로 약 ${b.toFixed(3)} 등급으로 추정됩니다.`;
  } else if (version === 'gwangju') {
    grade9 = gj;
    reason = `광주시 교육청 2025학년도 고1 등급평균 분석 자료 기준으로 약 ${gj.toFixed(3)} 등급으로 추정됩니다.`;
  } else {
    grade9 = (g + b + gj) / 3;
    reason = `경기진협(${g.toFixed(3)}), 부산시 교육청(${b.toFixed(3)}), 광주시 교육청(${gj.toFixed(3)})의 2025학년도 분석 자료를 평균하여 약 ${grade9.toFixed(3)} 등급으로 추정됩니다.`;
  }

  return { grade9: Number(grade9.toFixed(3)), reason };
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  primary: '#1B64DA',
  primarySoft: '#EBF2FF',
  primaryBorder: '#CFDFFB',
  accent: '#D97706',
  accentSoft: '#FEF3C7',
  success: '#059669',
  successSoft: '#D1FAE5',
  danger: '#DC2626',
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  border: '#E5E8EB',
  borderStrong: '#D1D6DB',
  text: '#191F28',
  textMuted: '#4E5968',
  textSubtle: '#8B95A1',
  dark: '#111827',
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UnivResult {
  name: string;
  dept: string;
  process: string;
  type: string;
  grade: number;
  badge: BadgeType;
  category: string;
}

type BadgeType = UniversityTargetPick['slotLabel'];

const CATEGORIES = [
  { id: '전체', emoji: '🔍' },
  { id: '인문', emoji: '📖' },
  { id: '사회', emoji: '🤝' },
  { id: '자연', emoji: '🌿' },
  { id: '공학', emoji: '⚙️' },
  { id: '의약', emoji: '🏥' },
  { id: '교육', emoji: '🎓' },
] as const;

const VERSIONS: { id: ConversionVersion; name: string; desc: string }[] = [
  { id: 'gyeonggi', name: '경기 진협', desc: '경기진학지도협의회 자료' },
  { id: 'busan',    name: '부산 교육청', desc: '부산시 교육청 자료' },
  { id: 'gwangju',  name: '광주 교육청', desc: '광주시 교육청 자료' },
  { id: 'mixed',    name: '통합 평균', desc: '경기/부산/광주 평균' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function getBadgeStyle(badge: BadgeType) {
  if (badge === '도전') return { bg: T.accentSoft, color: T.accent, stripe: T.accent };
  if (badge === '적정') return { bg: T.primarySoft, color: T.primary, stripe: T.primary };
  return { bg: T.successSoft, color: T.success, stripe: T.success };
}

function formatGap(gap: number) {
  if (gap > 0) return `+${gap.toFixed(2)}`;
  return gap.toFixed(2);
}

function TargetPicksPanel({
  studentName,
  picks,
  weaknesses,
  savingSlot,
  onClear,
  onOpenService,
}: {
  studentName: string | null;
  picks: UniversityPicks;
  weaknesses: ReadinessIssue[];
  savingSlot: TargetPickSlot | null;
  onClear: (slot: TargetPickSlot) => void;
  onOpenService?: (serviceId: number) => void;
}) {
  const hasAnyPick = TARGET_PICK_SLOTS.some(({ slot }) => picks[slot]);

  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 850, color: T.text }}>목표 대학 3 Picks</div>
          <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 3 }}>
            {studentName ? `${studentName} 학생 기준으로 저장됩니다` : '학생을 먼저 선택하면 도전/적정/안정 목표를 저장할 수 있습니다'}
          </div>
        </div>
        {hasAnyPick && (
          <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700 }}>
            다음 단계: 과목 설계 · 세특 보완
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
        {TARGET_PICK_SLOTS.map(({ slot, label }) => {
          const pick = picks[slot];
          const cfg = getBadgeStyle(label);
          return (
            <div
              key={slot}
              style={{
                minHeight: 120,
                borderRadius: 10,
                border: `1px solid ${pick ? cfg.stripe : T.border}`,
                background: pick ? cfg.bg : T.bg,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{label}</span>
                {pick && (
                  <button
                    onClick={() => onClear(slot)}
                    disabled={savingSlot === slot}
                    title={`${label} Pick 비우기`}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: `1px solid ${T.border}`,
                      background: T.surface,
                      color: T.textSubtle,
                      cursor: savingSlot === slot ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={13} strokeWidth={2.4} />
                  </button>
                )}
              </div>

              {pick ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 850, color: T.text, lineHeight: 1.25 }}>{pick.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, lineHeight: 1.35 }}>{pick.dept}</div>
                  <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 6 }}>
                    입결 {pick.grade.toFixed(2)} · 갭 {formatGap(pick.gradeGap)}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: T.textSubtle, lineHeight: 1.45 }}>
                  검색 결과에서 {label} 목표를 저장하세요.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(weaknesses.length > 0 || hasAnyPick) && (
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 850, color: T.textMuted, marginBottom: 6 }}>생기부 보완 포인트</div>
            {weaknesses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {weaknesses.slice(0, 2).map((item, index) => (
                  <div key={`${item.competency}-${index}`} style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.45 }}>
                    <strong style={{ color: T.text }}>{item.issue}</strong> — {item.recommendation}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: T.textSubtle }}>생기부 분석을 먼저 실행하면 목표 대학 기준 보완 포인트가 함께 표시됩니다.</div>
            )}
          </div>
          {onOpenService && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => onOpenService(2)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.primaryBorder}`,
                  background: T.primarySoft, color: T.primary, fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                과목 설계 <ArrowRight size={13} strokeWidth={2.4} />
              </button>
              <button
                onClick={() => onOpenService(4)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.surface, color: T.textMuted, fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                세특 보완 <ArrowRight size={13} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UniversityCard({
  univ,
  myGrade,
  onSavePick,
  disabled,
  savingSlot,
  savedSlots,
}: {
  univ: UnivResult;
  myGrade: number;
  onSavePick: (slot: TargetPickSlot, univ: UnivResult) => void;
  disabled: boolean;
  savingSlot: TargetPickSlot | null;
  savedSlots: TargetPickSlot[];
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = getBadgeStyle(univ.badge);
  const diff = univ.grade - myGrade;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'stretch',
        background: T.surface, borderRadius: 12,
        border: `1px solid ${T.border}`, overflow: 'hidden',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ width: 4, flexShrink: 0, background: cfg.stripe }} />
      <div style={{ flex: 1, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: T.textSubtle,
                background: T.bg, borderRadius: 4, padding: '2px 6px',
              }}>{univ.category}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 6px',
                background: cfg.bg, color: cfg.color,
              }}>{univ.badge}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
              {univ.name}
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{univ.dept}</div>
            <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 2 }}>{univ.type} · {univ.process}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: T.textSubtle, marginBottom: 2 }}>입결등급</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, tabularNums: true } as React.CSSProperties}>
              {univ.grade.toFixed(2)}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, marginTop: 2,
              color: diff < 0 ? T.danger : T.success,
            }}>
              {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
          {TARGET_PICK_SLOTS.map(({ slot, label }) => {
            const pickStyle = getBadgeStyle(label);
            const isSaved = savedSlots.includes(slot);
            const isSaving = savingSlot === slot;
            return (
              <button
                key={slot}
                onClick={() => onSavePick(slot, univ)}
                disabled={disabled || isSaving}
                title={`${label} 목표로 저장`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  minHeight: 30,
                  padding: '6px 9px',
                  borderRadius: 7,
                  border: `1px solid ${isSaved ? pickStyle.stripe : T.border}`,
                  background: isSaved ? pickStyle.bg : T.bg,
                  color: disabled ? T.textSubtle : pickStyle.color,
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: FONT,
                  cursor: disabled || isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                <Save size={12} strokeWidth={2.4} />
                {isSaving ? '저장 중' : `${label} 저장`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Service1Grade({ onOpenService }: { onOpenService?: (serviceId: number) => void }) {
  const { currentStudent, updateStudent, segibuAnalysis } = useStudent();
  const [gpa5, setGpa5] = useState(2.0);
  const [conversionVersion, setConversionVersion] = useState<ConversionVersion>('mixed');
  const [gradeCounts, setGradeCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRange, setSearchRange] = useState(0.3);
  const [selectedUniversity, setSelectedUniversity] = useState('전체');
  const [showAmbitious, setShowAmbitious] = useState(true);

  const [allResults, setAllResults] = useState<UnivResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savingSlot, setSavingSlot] = useState<TargetPickSlot | null>(null);

  const conversion = useMemo(() => convertGrade(gpa5, conversionVersion), [gpa5, conversionVersion]);
  const naesinData = useMemo(() => getNaesinData(currentStudent?.naesin_data), [currentStudent?.naesin_data]);
  const targetPicks = useMemo(() => getUniversityPicks(naesinData), [naesinData]);
  const readinessWeaknesses = segibuAnalysis?.admissionsReadiness?.criticalWeaknesses ?? [];

  const universityList = useMemo(() => {
    const unis = Array.from(new Set(allResults.map(r => r.name))).sort();
    return ['전체', ...unis];
  }, [allResults]);

  // 클라이언트 사이드 필터링
  const filteredResults = useMemo(() => {
    if (!allResults.length) return [];
    const g9 = conversion.grade9;
    const lower = showAmbitious ? Math.max(1.0, g9 - searchRange * 5.0) : g9 - searchRange;
    const upper = g9 + searchRange;

    return allResults.filter(r => {
      if (r.grade < lower || r.grade > upper) return false;
      if (selectedCategory !== '전체' && r.category !== selectedCategory) return false;
      if (selectedUniversity !== '전체' && r.name !== selectedUniversity) return false;
      if (searchQuery && !r.name.includes(searchQuery) && !r.dept.includes(searchQuery) && !r.process.includes(searchQuery)) return false;
      return true;
    }).sort((a, b) => a.grade - b.grade);
  }, [allResults, conversion.grade9, showAmbitious, searchRange, selectedCategory, selectedUniversity, searchQuery]);

  // 계열별 카운트
  const categoryCounts = useMemo(() => {
    const g9 = conversion.grade9;
    const lower = showAmbitious ? Math.max(1.0, g9 - searchRange * 5.0) : g9 - searchRange;
    const upper = g9 + searchRange;
    const base = allResults.filter(r => {
      if (r.grade < lower || r.grade > upper) return false;
      if (selectedUniversity !== '전체' && r.name !== selectedUniversity) return false;
      if (searchQuery && !r.name.includes(searchQuery) && !r.dept.includes(searchQuery)) return false;
      return true;
    });
    const counts: Record<string, number> = { '전체': base.length };
    base.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return counts;
  }, [allResults, conversion.grade9, showAmbitious, searchRange, selectedUniversity, searchQuery]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setSelectedCategory('전체');
    setSelectedUniversity('전체');
    try {
      const res = await fetch(`/api/universities?grade=${conversion.grade9}&range=3.5&limit=500`);
      if (!res.ok) throw new Error('검색 실패');
      const data = await res.json();
      setAllResults(data.results);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [conversion.grade9]);

  const calculateGPA = () => {
    const total = Object.values(gradeCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    const sum = Object.entries(gradeCounts).reduce((a, [g, c]) => a + parseInt(g) * c, 0);
    setGpa5(Math.min(5, Math.max(1, Number((sum / total).toFixed(3)))));
    setShowCalculator(false);
  };

  const resetFilters = () => {
    setSelectedUniversity('전체');
    setSelectedCategory('전체');
    setSearchQuery('');
    setSearchRange(0.3);
    setShowAmbitious(true);
  };

  const saveTargetPick = useCallback(async (slot: TargetPickSlot, univ: UnivResult) => {
    setSaveMessage(null);
    if (!currentStudent) {
      setSaveMessage('학생을 먼저 선택하거나 등록한 뒤 목표 대학을 저장할 수 있습니다.');
      return;
    }

    const savedAt = new Date().toISOString();
    const pick: UniversityTargetPick = {
      slot,
      slotLabel: TARGET_PICK_LABELS[slot],
      name: univ.name,
      dept: univ.dept,
      process: univ.process,
      type: univ.type,
      category: univ.category,
      grade: univ.grade,
      badge: univ.badge,
      currentGrade9: conversion.grade9,
      gradeGap: Number((univ.grade - conversion.grade9).toFixed(3)),
      source: 'service1-2025-admissions',
      savedAt,
    };

    const nextNaesinData: NaesinData = {
      ...naesinData,
      service1: {
        grade5: gpa5,
        grade9: conversion.grade9,
        conversionVersion,
        conversionReason: conversion.reason,
        searchRange,
        showAmbitious,
        updatedAt: savedAt,
      },
      university_picks: {
        ...targetPicks,
        [slot]: pick,
      },
    };

    setSavingSlot(slot);
    const updated = await updateStudent(currentStudent.id, {
      target_dept: univ.dept,
      naesin_data: nextNaesinData,
    });
    setSavingSlot(null);

    if (!updated) {
      setSaveMessage('저장에 실패했습니다. 로그인 상태나 Supabase 연결을 확인해주세요.');
      return;
    }
    setSaveMessage(`${TARGET_PICK_LABELS[slot]} 목표로 ${univ.name} ${univ.dept}을 저장했습니다.`);
  }, [conversion.grade9, conversion.reason, conversionVersion, currentStudent, gpa5, naesinData, searchRange, showAmbitious, targetPicks, updateStudent]);

  const clearTargetPick = useCallback(async (slot: TargetPickSlot) => {
    setSaveMessage(null);
    if (!currentStudent) return;

    const nextPicks: UniversityPicks = { ...targetPicks };
    delete nextPicks[slot];
    const savedAt = new Date().toISOString();
    const nextNaesinData: NaesinData = {
      ...naesinData,
      service1: {
        grade5: gpa5,
        grade9: conversion.grade9,
        conversionVersion,
        conversionReason: conversion.reason,
        searchRange,
        showAmbitious,
        updatedAt: savedAt,
      },
      university_picks: nextPicks,
    };

    setSavingSlot(slot);
    const updated = await updateStudent(currentStudent.id, { naesin_data: nextNaesinData });
    setSavingSlot(null);

    if (!updated) {
      setSaveMessage('목표 대학을 비우지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setSaveMessage(`${TARGET_PICK_LABELS[slot]} 목표를 비웠습니다.`);
  }, [conversion.grade9, conversion.reason, conversionVersion, currentStudent, gpa5, naesinData, searchRange, showAmbitious, targetPicks, updateStudent]);

  const badgeCounts = {
    도전: filteredResults.filter(r => r.badge === '도전').length,
    적정: filteredResults.filter(r => r.badge === '적정').length,
    안정: filteredResults.filter(r => r.badge === '안정').length,
  };

  return (
    <div style={{ fontFamily: FONT, color: T.text, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 성적 입력 카드 ── */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}>성적 입력</div>
            <div style={{ fontSize: 13, color: T.textSubtle, marginTop: 3 }}>5등급제 내신을 입력하면 9등급제로 자동 환산됩니다</div>
          </div>
          <button
            onClick={() => setShowCalculator(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 20,
              background: showCalculator ? T.dark : T.bg,
              color: showCalculator ? '#fff' : T.textMuted,
              border: `1px solid ${showCalculator ? T.dark : T.border}`,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
              <line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/>
            </svg>
            등급 계산기
          </button>
        </div>

        {/* 슬라이더 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 'clamp(40px, 4vw, 56px)', fontWeight: 900, color: T.primary, letterSpacing: '-0.04em', lineHeight: 1 }}>{gpa5.toFixed(3)}</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: T.textSubtle }}>등급</span>
            <span style={{ fontSize: 13, color: T.textSubtle, marginLeft: 4 }}>(5등급제)</span>
          </div>

          <input
            type="range" min={1} max={5} step={0.001} value={gpa5}
            onChange={e => setGpa5(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: T.primary, cursor: 'pointer', height: 6 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map(v => (
              <div key={v} style={{ textAlign: 'center' }}>
                <div style={{
                  height: 3, width: 40, borderRadius: 2, margin: '0 auto 4px',
                  background: Math.abs(gpa5 - v) <= 0.5 ? T.primary : T.border,
                  transition: 'background 0.15s',
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textSubtle }}>{v}.0</span>
              </div>
            ))}
          </div>
        </div>

        {/* 계산기 패널 */}
        {showCalculator && (
          <div style={{
            background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
            padding: '20px', display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, letterSpacing: '-0.01em' }}>
              등급별 과목 수 입력
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(grade => (
                <div key={grade} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 6 }}>{grade}등급</div>
                  <input
                    type="number" min={0} value={gradeCounts[grade as keyof typeof gradeCounts]}
                    onChange={e => setGradeCounts(prev => ({ ...prev, [grade]: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%', padding: '10px 4px', textAlign: 'center',
                      fontSize: 16, fontWeight: 700, fontFamily: FONT, color: T.text,
                      background: T.surface, border: `1.5px solid ${T.border}`,
                      borderRadius: 8, outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={calculateGPA}
              style={{
                padding: '12px', borderRadius: 10, background: T.dark, color: '#fff',
                fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: FONT,
              }}
            >
              계산 결과 적용
            </button>
          </div>
        )}

        {/* 환산 버전 선택 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {VERSIONS.map(v => (
            <button
              key={v.id}
              onClick={() => setConversionVersion(v.id)}
              style={{
                padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                border: `2px solid ${conversionVersion === v.id ? T.dark : T.border}`,
                background: conversionVersion === v.id ? T.dark : T.surface,
                transition: 'all 0.15s', fontFamily: FONT,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, color: conversionVersion === v.id ? 'rgba(255,255,255,0.5)' : T.textSubtle }}>{v.desc}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: conversionVersion === v.id ? '#fff' : T.text }}>{v.name}</div>
            </button>
          ))}
        </div>

        {/* 환산 결과 강조 박스 */}
        <div style={{
          background: T.dark, borderRadius: 16, padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-block', background: T.primary, borderRadius: 20,
              padding: '3px 12px', fontSize: 11, fontWeight: 700, color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            }}>
              9등급 환산 결과
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 360 }}>
              {conversion.reason}
            </p>
            {gpa5 <= 1.5 && (
              <p style={{ fontSize: 12, color: '#93C5FD', marginTop: 8 }}>
                💡 최상위 대학을 더 보려면 아래 &apos;소신 지원 포함&apos;을 켜주세요
              </p>
            )}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 24px',
            border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>환산 등급</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 'clamp(40px, 4vw, 54px)', fontWeight: 900, color: '#818CF8', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {conversion.grade9.toFixed(3)}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>등급</span>
            </div>
          </div>
        </div>

        {/* 계열별 탭 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.textMuted }}>계열별 탐색</span>
            {searched && (
              <span style={{ fontSize: 12, color: T.textSubtle }}>
                검색 범위 ±{searchRange.toFixed(2)} 기준
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat.id] || 0;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 5, padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${isActive ? T.primary : T.border}`,
                    background: isActive ? T.primarySoft : T.surface,
                    transition: 'all 0.15s', fontFamily: FONT,
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    boxShadow: isActive ? '0 4px 12px rgba(27,100,218,0.15)' : 'none',
                  }}
                >
                  {count > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      background: isActive ? T.primary : T.text, color: '#fff',
                      fontSize: 9, fontWeight: 800, borderRadius: 10,
                      padding: '1px 5px', minWidth: 18, textAlign: 'center',
                    }}>{count}</span>
                  )}
                  <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? T.primary : T.textMuted }}>{cat.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <TargetPicksPanel
        studentName={currentStudent?.name ?? null}
        picks={targetPicks}
        weaknesses={readinessWeaknesses}
        savingSlot={savingSlot}
        onClear={clearTargetPick}
        onOpenService={onOpenService}
      />

      {saveMessage && (
        <div style={{
          background: saveMessage.includes('실패') || saveMessage.includes('먼저') ? '#FEF2F2' : T.successSoft,
          border: `1px solid ${saveMessage.includes('실패') || saveMessage.includes('먼저') ? '#FECACA' : '#BBF7D0'}`,
          color: saveMessage.includes('실패') || saveMessage.includes('먼저') ? T.danger : T.success,
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
          fontWeight: 700,
        }}>
          {saveMessage}
        </div>
      )}

      {/* ── 필터 + 검색 영역 ── */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 상단: 소신 지원, 범위, 필터 초기화 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setShowAmbitious(v => !v)}
              style={{
                position: 'relative', width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                background: showAmbitious ? T.primary : T.borderStrong, transition: 'background 0.15s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: showAmbitious ? 21 : 3,
                width: 16, height: 16, borderRadius: 8, background: '#fff',
                transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.textMuted }}>소신 지원 포함</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {[0.1, 0.3, 0.5].map(r => (
                <button key={r} onClick={() => setSearchRange(r)}
                  style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: 'none', fontFamily: FONT,
                    background: searchRange === r ? T.primary : 'transparent',
                    color: searchRange === r ? '#fff' : T.textMuted,
                    transition: 'all 0.12s',
                  }}>
                  ±{r}
                </button>
              ))}
            </div>
            <button onClick={resetFilters}
              style={{
                fontSize: 12, fontWeight: 700, color: T.textSubtle, background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: FONT, padding: '6px 8px',
              }}>
              초기화
            </button>
          </div>
        </div>

        {/* 대학 드롭다운 + 키워드 검색 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.primary }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <select
              value={selectedUniversity}
              onChange={e => setSelectedUniversity(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 36px',
                fontSize: 13, fontWeight: 600, fontFamily: FONT, color: T.text,
                background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                outline: 'none', cursor: 'pointer', appearance: 'none',
              }}
            >
              {universityList.map(u => (
                <option key={u} value={u}>{u === '전체' ? '모든 대학교' : u}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.primary }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="학과명, 전형명 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 36px',
                fontSize: 13, fontWeight: 500, fontFamily: FONT, color: T.text,
                background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* 대학 찾기 버튼 */}
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '14px', borderRadius: 10,
            background: loading ? T.borderStrong : T.primary, color: '#fff',
            fontSize: 15, fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONT, letterSpacing: '-0.02em', transition: 'opacity 0.12s',
          }}
        >
          {loading ? '검색 중...' : `대학 찾기 — ${conversion.grade9.toFixed(3)}등급 기준`}
        </button>

        {error && <div style={{ fontSize: 13, color: T.danger, textAlign: 'center' }}>{error}</div>}
      </div>

      {/* ── 결과 섹션 ── */}
      {searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 결과 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>
                적정 대학 목록
              </div>
              <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 2 }}>
                9등급 환산 {conversion.grade9.toFixed(3)} 기준 · 총 {filteredResults.length}개
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['도전', '적정', '안정'] as BadgeType[]).map(b => {
                const cfg = getBadgeStyle(b);
                return (
                  <div key={b} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 20,
                    background: cfg.bg, color: cfg.color,
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {b} {badgeCounts[b]}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 등급 2 미만 + 소신 미포함 알림 */}
          {conversion.grade9 < 2.0 && !showAmbitious && (
            <div style={{
              background: T.accentSoft, border: `1px solid #FDE68A`, borderRadius: 10,
              padding: '12px 16px', fontSize: 13, color: '#92400E', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              💡 최상위권 대학을 더 보려면 위의 <strong>소신 지원 포함</strong>을 켜주세요
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: T.textSubtle, fontSize: 14 }}>검색 중...</div>
          ) : filteredResults.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 40 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>조건에 맞는 대학이 없습니다</div>
              <div style={{ fontSize: 13, color: T.textSubtle }}>
                현재 범위(±{searchRange.toFixed(2)}) 내에 결과가 없어요
              </div>
              <button
                onClick={() => setSearchRange(0.3)}
                style={{
                  marginTop: 4, padding: '10px 24px', borderRadius: 20,
                  background: T.primary, color: '#fff',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: FONT,
                }}
              >
                범위 ±0.3으로 확대
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
              {filteredResults.map((univ, i) => (
                <UniversityCard
                  key={`${univ.name}-${univ.dept}-${i}`}
                  univ={univ}
                  myGrade={conversion.grade9}
                  onSavePick={saveTargetPick}
                  disabled={!currentStudent}
                  savingSlot={savingSlot}
                  savedSlots={TARGET_PICK_SLOTS
                    .filter(({ slot }) => {
                      const pick = targetPicks[slot];
                      return pick?.name === univ.name && pick.dept === univ.dept && pick.process === univ.process;
                    })
                    .map(({ slot }) => slot)}
                />
              ))}
            </div>
          )}

          <p style={{ fontSize: 12, color: T.textSubtle, textAlign: 'center', margin: 0 }}>
            * 2025학년도 어디가 입결 데이터 기준. 실제 입시 결과와 다를 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
