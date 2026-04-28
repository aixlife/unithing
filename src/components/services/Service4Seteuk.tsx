'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import {
  getNaesinData,
  getPrimaryTargetPick,
  getSeteukRecords,
  getUniversityPicks,
} from '@/types/student';
import type { ReadinessIssue } from '@/types/analysis';
import type { SeteukPlanItem, SeteukRecord, UniversityTargetPick } from '@/types/student';
import type { UniversitySubjectRecord } from '@/types/subjects';

const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  accent: '#F59E0B', accentSoft: '#FEF3C7', accentBorder: '#FCD34D',
  indigo: '#4F46E5', indigoSoft: '#EEF2FF', indigoBorder: '#C7D2FE',
  emerald: '#059669', emeraldSoft: '#D1FAE5',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  error: '#DC2626', errorSoft: '#FEF2F2',
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";
type Phase = 1 | 2 | 3 | 4 | 5 | 6;

interface TopicItem { title: string; description: string }
interface MotivationItem { type: string; content: string }
interface CompetencyItem { name: string; behavior: string }
interface FollowUpItem { type: string; content: string }
type PlanItem = SeteukPlanItem;

const PHASES = [
  { id: 1, label: '기본 정보 입력' },
  { id: 2, label: '탐구 주제 추천' },
  { id: 3, label: '동기 확인' },
  { id: 4, label: '핵심 역량 확인' },
  { id: 5, label: '탐구 후속활동' },
  { id: 6, label: '최종 결과 확인' },
] as const;

const TIPS: Record<number, { expert: string; writing: string }> = {
  1: {
    expert: '희망 학과와 관련된 최근 이슈나 교과서의 \'심화 탐구\' 섹션을 참고해 보세요.',
    writing: '학생의 평소 관심사가 어떻게 교과 활동으로 이어졌는지 보여주는 시작점입니다.',
  },
  2: {
    expert: '너무 넓은 주제보다는 실생활의 구체적인 현상을 분석하는 주제가 좋은 평가를 받습니다.',
    writing: '주제 명칭만으로도 탐구의 깊이와 방향성이 드러나도록 구체적으로 기술하세요.',
  },
  3: {
    expert: '단순히 \'궁금해서\'보다는 \'수업 중 배운 ~개념을 확장하기 위해\'와 같은 학술적 동기가 좋습니다.',
    writing: '자기주도적 학습 태도와 지적 호기심이 드러나도록 동기를 서술하는 것이 핵심입니다.',
  },
  4: {
    expert: '선택한 역량이 탐구 과정에서 어떻게 발휘되었는지 구체적인 행동 지표로 보여줘야 합니다.',
    writing: '역량의 명칭보다는 해당 역량을 증명할 수 있는 구체적인 활동 사례를 문장에 녹여내세요.',
  },
  5: {
    expert: '탐구로 끝내지 않고 관련 도서를 찾아보거나 실험을 설계하는 등 \'확장성\'을 보여주세요.',
    writing: '탐구 이후의 변화와 성장을 언급하여 학업에 대한 열정과 발전 가능성을 강조하세요.',
  },
};

const LS_DATA = 'unithing_seteuk_data';
const LS_PHASE = 'unithing_seteuk_phase';

type SavedSeteukData = {
  major?: string;
  interest?: string;
  activities?: string;
  topics?: TopicItem[];
  selectedTopic?: string;
  motivations?: MotivationItem[];
  selectedMotivation?: string;
  competencies?: CompetencyItem[];
  selectedCompetencies?: string[];
  followUps?: FollowUpItem[];
  selectedFollowUp?: string;
  draft?: string;
  plan?: { plan: PlanItem[] };
};

type SeteukSuggestion = {
  id: string;
  title: string;
  weakness: string;
  recommendation: string;
  interest: string;
  activities: string;
};

const COMPETENCY_LABELS: Record<ReadinessIssue['competency'], string> = {
  academic: '학업역량',
  career: '진로역량',
  community: '공동체역량',
};

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function truncateText(value: string, max = 74) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function getStorageKeys(studentId?: string) {
  const suffix = studentId ? `_${studentId}` : '';
  return {
    data: `${LS_DATA}${suffix}`,
    phase: `${LS_PHASE}${suffix}`,
  };
}

function createRecordId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `seteuk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTargetLabel(targetPick: UniversityTargetPick | null, fallbackDept: string) {
  const dept = targetPick?.dept || fallbackDept;
  return [targetPick?.name, dept].filter(Boolean).join(' ');
}

function collectSubjectHints(records: UniversitySubjectRecord[]) {
  return uniq(records.flatMap((record) => [
    ...record.coreSubjects,
    ...record.recommendedSubjects,
  ])).slice(0, 8);
}

function buildRemediationSuggestions(
  weaknesses: ReadinessIssue[],
  targetPick: UniversityTargetPick | null,
  fallbackDept: string,
  subjectHints: string[],
) {
  const target = getTargetLabel(targetPick, fallbackDept);
  const subjectText = subjectHints.slice(0, 5).join(', ');

  if (weaknesses.length === 0) {
    if (!target && subjectHints.length === 0) return [];
    return [{
      id: 'target-based',
      title: '목표 학과 연계 탐구',
      weakness: target ? `${target} 지원 맥락을 세특 활동으로 보강` : '목표 학과 맥락 보강',
      recommendation: subjectText ? `권장과목 ${subjectText}와 연결되는 교과 탐구를 설계` : '목표 학과와 연결되는 교과 탐구를 설계',
      interest: target ? `${target}와 연결되는 교과 개념을 실제 문제에 적용하는 탐구` : '목표 학과와 연결되는 교과 개념을 실제 문제에 적용하는 탐구',
      activities: [
        target ? `목표 대학/학과: ${target}` : '',
        subjectText ? `연계 과목: ${subjectText}` : '',
        '활동 방향: 수업 개념에서 출발해 질문, 자료 분석, 후속 탐구로 이어지는 세특 근거 만들기',
      ].filter(Boolean).join('\n'),
    }];
  }

  return weaknesses.slice(0, 3).map((item, index) => {
    const label = COMPETENCY_LABELS[item.competency];
    return {
      id: `${item.competency}-${index}`,
      title: `${label} 보완 탐구`,
      weakness: item.issue,
      recommendation: item.recommendation,
      interest: `${item.issue}\n${item.recommendation}`,
      activities: [
        target ? `목표 대학/학과: ${target}` : '',
        subjectText ? `연계 과목: ${subjectText}` : '',
        `생기부 근거: ${item.evidence}`,
        `보완 방향: ${item.recommendation}`,
      ].filter(Boolean).join('\n'),
    };
  });
}

function buildOneLineFeedback(topic: string, weaknesses: ReadinessIssue[]) {
  const weakness = weaknesses[0]?.issue;
  if (weakness) return `${topic} 활동으로 "${truncateText(weakness, 48)}" 보완 근거를 만드는 세특 초안입니다.`;
  return `${topic} 활동을 목표 학과와 연결해 탐구 과정과 후속 성장을 보여주는 세특 초안입니다.`;
}

// ─── Input helpers ────────────────────────────────────────────────────────────
function inputStyle(focused: boolean) {
  return {
    width: '100%', borderRadius: 10,
    border: `1px solid ${focused ? T.primary : T.border}`,
    padding: '12px 14px', fontSize: 16, color: T.text,
    background: T.surface, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' as const,
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.textMuted, marginBottom: 6, fontFamily: FONT }}>{children}</label>;
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28, ...style }}>
      {children}
    </div>
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <SectionCard>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>⏳</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: FONT, marginBottom: 6 }}>AI가 분석 중...</div>
        <div style={{ fontSize: 15, color: T.textMuted, fontFamily: FONT }}>{message}</div>
      </div>
    </SectionCard>
  );
}

function RefreshBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        background: T.indigoSoft, border: `1px solid ${T.indigoBorder}`,
        color: T.indigo, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: FONT, opacity: loading ? 0.6 : 1,
      }}
    >
      <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
      새로운 추천받기
    </button>
  );
}

// ─── Progress Sidebar ─────────────────────────────────────────────────────────
function Sidebar({ phase, onReset }: { phase: Phase; onReset: () => void }) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
      padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, letterSpacing: '0.05em', marginBottom: 6, fontFamily: FONT }}>세특 도우미</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT }}>단계 {phase} / 6</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {PHASES.map((p) => {
          const done = phase > p.id;
          const active = phase === p.id;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: active ? T.indigoSoft : 'transparent',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: active ? T.indigo : done ? T.emerald : T.bgAlt,
                border: `1.5px solid ${active ? T.indigo : done ? T.emerald : T.borderStrong}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: (active || done) ? '#fff' : T.textSubtle, fontWeight: 700, fontFamily: FONT,
              }}>
                {done ? '✓' : p.id}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.indigo : (done ? T.textMuted : T.textSubtle), fontFamily: FONT, lineHeight: 1.3 }}>
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onReset}
        style={{
          marginTop: 20, padding: '10px', borderRadius: 10,
          background: T.errorSoft, border: `1px solid #FCA5A5`,
          color: T.error, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        ↺ 처음부터 다시하기
      </button>
    </div>
  );
}

// ─── Tips section ─────────────────────────────────────────────────────────────
function TipsSection({ phase }: { phase: Phase }) {
  if (phase >= 6) return null;
  const tip = TIPS[phase];
  if (!tip) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
      <div style={{ background: T.accentSoft, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4, fontFamily: FONT }}>진로쌤의 Tip!</div>
          <p style={{ fontSize: 12, color: '#78350F', margin: 0, lineHeight: 1.6, fontFamily: FONT }}>{tip.expert}</p>
        </div>
      </div>
      <div style={{ background: T.indigoSoft, border: `1px solid ${T.indigoBorder}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✨</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#312E81', marginBottom: 4, fontFamily: FONT }}>좋은 세특 작성을 위한 Tip</div>
          <p style={{ fontSize: 12, color: '#3730A3', margin: 0, lineHeight: 1.6, fontFamily: FONT }}>{tip.writing}</p>
        </div>
      </div>
    </div>
  );
}

function RemediationPanel({
  suggestions,
  onApplySuggestion,
  savedRecords,
  onLoadRecord,
  targetLabel,
  subjectHints,
}: {
  suggestions: SeteukSuggestion[];
  onApplySuggestion: (suggestion: SeteukSuggestion) => void;
  savedRecords: SeteukRecord[];
  onLoadRecord: (record: SeteukRecord) => void;
  targetLabel: string;
  subjectHints: string[];
}) {
  if (suggestions.length === 0 && savedRecords.length === 0 && !targetLabel && subjectHints.length === 0) return null;

  return (
    <SectionCard style={{ marginBottom: 16, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text, fontFamily: FONT }}>생기부 보완 맥락</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.5, fontFamily: FONT }}>
            목표와 분석 결과를 세특 입력으로 이어받았습니다.
          </p>
        </div>
        {(targetLabel || subjectHints.length > 0) && (
          <div style={{ minWidth: 220, textAlign: 'right' }}>
            {targetLabel && <div style={{ fontSize: 13, fontWeight: 700, color: T.indigo, fontFamily: FONT }}>{targetLabel}</div>}
            {subjectHints.length > 0 && (
              <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 4, lineHeight: 1.5, fontFamily: FONT }}>
                {subjectHints.slice(0, 5).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: savedRecords.length > 0 ? 18 : 0 }}>
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} style={{ border: `1px solid ${T.indigoBorder}`, background: T.indigoSoft, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.indigo, marginBottom: 6, fontFamily: FONT }}>{suggestion.title}</div>
              <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55, fontFamily: FONT, minHeight: 56 }}>
                {truncateText(suggestion.weakness, 92)}
              </div>
              <button
                onClick={() => onApplySuggestion(suggestion)}
                style={{
                  width: '100%', height: 36, marginTop: 12, borderRadius: 8,
                  border: `1px solid ${T.indigo}`, background: T.surface, color: T.indigo,
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
                }}
              >
                입력에 적용
              </button>
            </div>
          ))}
        </div>
      )}

      {savedRecords.length > 0 && (
        <div style={{ borderTop: suggestions.length > 0 ? `1px solid ${T.border}` : 'none', paddingTop: suggestions.length > 0 ? 16 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.textMuted, marginBottom: 10, fontFamily: FONT }}>저장된 세특 결과</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedRecords.slice(0, 3).map((record) => (
              <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.selectedTopic || record.major}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 2, fontFamily: FONT }}>
                    {new Date(record.savedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={() => onLoadRecord(record)}
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8,
                    border: `1px solid ${T.borderStrong}`, background: T.surface, color: T.textMuted,
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, flexShrink: 0,
                  }}
                >
                  불러오기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Phase 1: 기본 정보 ───────────────────────────────────────────────────────
function Phase1({
  major, setMajor, interest, setInterest, activities, setActivities,
  onNext, loading,
}: {
  major: string; setMajor: (v: string) => void;
  interest: string; setInterest: (v: string) => void;
  activities: string; setActivities: (v: string) => void;
  onNext: () => void; loading: boolean;
}) {
  const [focuses, setFocuses] = useState({ major: false, interest: false, activities: false });
  const canNext = major.trim().length > 0 && interest.trim().length > 0;

  return (
    <SectionCard>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', margin: '0 0 4px', fontFamily: FONT }}>기본 정보 입력</h2>
      <p style={{ fontSize: 15, color: T.textMuted, margin: '0 0 24px', fontFamily: FONT }}>희망 학과와 관심 있는 주제를 입력해 주세요.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Label>희망 학과</Label>
          <input
            type="text" value={major} onChange={(e) => setMajor(e.target.value)}
            placeholder="예: 컴퓨터공학과, 생명과학과 등"
            style={inputStyle(focuses.major)}
            onFocus={() => setFocuses(f => ({ ...f, major: true }))}
            onBlur={() => setFocuses(f => ({ ...f, major: false }))}
          />
        </div>
        <div>
          <Label>평소 탐구하고자 하는 주제나 호기심</Label>
          <textarea
            value={interest} onChange={(e) => setInterest(e.target.value)}
            placeholder="예: 인공지능의 윤리적 문제, 유전자 가위 기술의 발전 등"
            rows={3}
            style={{ ...inputStyle(focuses.interest), resize: 'vertical' }}
            onFocus={() => setFocuses(f => ({ ...f, interest: true }))}
            onBlur={() => setFocuses(f => ({ ...f, interest: false }))}
          />
        </div>
        <div>
          <Label>기존에 해본 관련된 활동 (선택 사항)</Label>
          <textarea
            value={activities} onChange={(e) => setActivities(e.target.value)}
            placeholder="예: 수학 시간에 배운 미분 개념을 활용한 물리 문제 해결 등"
            rows={3}
            style={{ ...inputStyle(focuses.activities), resize: 'vertical' }}
            onFocus={() => setFocuses(f => ({ ...f, activities: true }))}
            onBlur={() => setFocuses(f => ({ ...f, activities: false }))}
          />
        </div>
      </div>

      <button
        onClick={onNext} disabled={!canNext || loading}
        style={{
          width: '100%', height: 48, borderRadius: 10, marginTop: 24,
          background: canNext && !loading ? T.indigo : T.bgAlt,
          color: canNext && !loading ? '#fff' : T.textSubtle,
          border: 'none', fontSize: 16, fontWeight: 700,
          cursor: canNext && !loading ? 'pointer' : 'not-allowed', fontFamily: FONT,
        }}
      >
        {loading ? 'AI 주제 추천 중...' : '다음 단계로'}
      </button>
    </SectionCard>
  );
}

// ─── Phase 2: 탐구 주제 ───────────────────────────────────────────────────────
function Phase2({
  topics, loading, selectedTopic, setSelectedTopic, onRefresh, onNext,
}: {
  topics: TopicItem[]; loading: boolean;
  selectedTopic: string; setSelectedTopic: (v: string) => void;
  onRefresh: () => void; onNext: () => void;
}) {
  const [focused, setFocused] = useState(false);

  if (loading) return <LoadingCard message="10~20초 정도 소요될 수 있어요." />;

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', margin: 0, fontFamily: FONT }}>탐구 주제 추천</h2>
          <p style={{ fontSize: 15, color: T.textMuted, margin: '4px 0 0', fontFamily: FONT }}>추천된 주제 중 하나를 선택하거나 직접 입력하세요.</p>
        </div>
        <RefreshBtn onClick={onRefresh} loading={loading} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {topics.map((topic, i) => {
          const chosen = selectedTopic === topic.title;
          return (
            <div key={i} onClick={() => setSelectedTopic(topic.title)} style={{
              padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
              background: chosen ? T.indigoSoft : T.surfaceAlt,
              border: `2px solid ${chosen ? T.indigo : T.border}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: chosen ? T.indigo : T.text, letterSpacing: '-0.01em', marginBottom: 6, fontFamily: FONT }}>{topic.title}</div>
                  <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>{topic.description}</div>
                </div>
                {chosen && <span style={{ fontSize: 18, color: T.indigo, flexShrink: 0 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginBottom: 20 }}>
        <Label>직접 수정하거나 확정된 주제</Label>
        <input
          type="text" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}
          placeholder="위 추천 주제를 클릭하거나 직접 입력하세요."
          style={inputStyle(focused)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>

      <button
        onClick={onNext} disabled={!selectedTopic.trim()}
        style={{
          width: '100%', height: 48, borderRadius: 10,
          background: selectedTopic.trim() ? T.indigo : T.bgAlt,
          color: selectedTopic.trim() ? '#fff' : T.textSubtle,
          border: 'none', fontSize: 16, fontWeight: 700,
          cursor: selectedTopic.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT,
        }}
      >
        이 주제로 시작하기
      </button>
    </SectionCard>
  );
}

// ─── Phase 3: 탐구 동기 ───────────────────────────────────────────────────────
function Phase3({
  motivations, loading, selectedMotivation, setSelectedMotivation, onRefresh,
}: {
  motivations: MotivationItem[]; loading: boolean;
  selectedMotivation: string; setSelectedMotivation: (v: string) => void;
  onRefresh: () => void;
}) {
  const [focused, setFocused] = useState(false);

  if (loading) return <LoadingCard message="동기를 분석 중이에요..." />;

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', margin: 0, fontFamily: FONT }}>동기 확인</h2>
          <p style={{ fontSize: 15, color: T.textMuted, margin: '4px 0 0', fontFamily: FONT }}>탐구 활동의 시작이 될 동기를 선택해 주세요.</p>
        </div>
        <RefreshBtn onClick={onRefresh} loading={loading} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {motivations.map((mot, i) => {
          const chosen = selectedMotivation === mot.content;
          return (
            <div key={i} onClick={() => setSelectedMotivation(mot.content)} style={{
              padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
              background: chosen ? T.indigoSoft : T.surfaceAlt,
              border: `2px solid ${chosen ? T.indigo : T.border}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: 11, fontWeight: 700, borderRadius: 4, background: T.indigoSoft, color: T.indigo, marginBottom: 8, fontFamily: FONT, letterSpacing: '0.03em' }}>
                    {mot.type}
                  </span>
                  <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65, fontFamily: FONT }}>{mot.content}</div>
                </div>
                {chosen && <span style={{ fontSize: 16, color: T.indigo, flexShrink: 0, marginTop: 2 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        <Label>선택한 탐구 동기 수정</Label>
        <textarea
          value={selectedMotivation} onChange={(e) => setSelectedMotivation(e.target.value)}
          placeholder="위 유형 중 하나를 선택하거나 내용을 다듬어 입력해 주세요."
          rows={4}
          style={{ ...inputStyle(focused), resize: 'vertical' }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </SectionCard>
  );
}

// ─── Phase 4: 핵심 역량 ───────────────────────────────────────────────────────
function Phase4({
  competencies, loading, selectedCompetencies, onToggle, onRefresh,
}: {
  competencies: CompetencyItem[]; loading: boolean;
  selectedCompetencies: string[];
  onToggle: (key: string) => void;
  onRefresh: () => void;
}) {
  if (loading) return <LoadingCard message="역량을 분석 중이에요..." />;

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', margin: 0, fontFamily: FONT }}>핵심 역량 확인</h2>
          <p style={{ fontSize: 15, color: T.textMuted, margin: '4px 0 0', fontFamily: FONT }}>강조하고 싶은 역량을 모두 선택해 주세요. (복수 선택 가능)</p>
        </div>
        <RefreshBtn onClick={onRefresh} loading={loading} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {competencies.map((comp, i) => {
          const key = `${comp.name}: ${comp.behavior}`;
          const chosen = selectedCompetencies.includes(key);
          return (
            <div key={i} onClick={() => onToggle(key)} style={{
              padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
              background: chosen ? T.indigoSoft : T.surfaceAlt,
              border: `2px solid ${chosen ? T.indigo : T.border}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: chosen ? T.indigo : T.text, marginBottom: 6, fontFamily: FONT }}>{comp.name}</div>
                  <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>{comp.behavior}</div>
                </div>
                {chosen && <span style={{ fontSize: 18, color: T.indigo, flexShrink: 0 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCompetencies.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <Label>선택된 핵심 역량</Label>
          <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedCompetencies.map((c, i) => (
              <div key={i} style={{ fontSize: 14, color: T.text, fontFamily: FONT, lineHeight: 1.5 }}>• {c}</div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Phase 5: 탐구 후속활동 ───────────────────────────────────────────────────
function Phase5({
  followUps, loading, selectedFollowUp, setSelectedFollowUp, onRefresh,
}: {
  followUps: FollowUpItem[]; loading: boolean;
  selectedFollowUp: string; setSelectedFollowUp: (v: string) => void;
  onRefresh: () => void;
}) {
  const [focused, setFocused] = useState(false);

  if (loading) return <LoadingCard message="후속활동을 추천 중이에요..." />;

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', margin: 0, fontFamily: FONT }}>탐구 후속활동</h2>
          <p style={{ fontSize: 15, color: T.textMuted, margin: '4px 0 0', fontFamily: FONT }}>탐구 이후 심화할 수 있는 후속 활동을 선택해 주세요.</p>
        </div>
        <RefreshBtn onClick={onRefresh} loading={loading} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {followUps.map((fu, i) => {
          const chosen = selectedFollowUp === fu.content;
          return (
            <div key={i} onClick={() => setSelectedFollowUp(fu.content)} style={{
              padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
              background: chosen ? T.indigoSoft : T.surfaceAlt,
              border: `2px solid ${chosen ? T.indigo : T.border}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: 11, fontWeight: 700, borderRadius: 4, background: T.emeraldSoft, color: T.emerald, marginBottom: 8, fontFamily: FONT, letterSpacing: '0.03em' }}>
                    {fu.type}
                  </span>
                  <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65, fontFamily: FONT }}>{fu.content}</div>
                </div>
                {chosen && <span style={{ fontSize: 16, color: T.indigo, flexShrink: 0, marginTop: 2 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        <Label>최종 선택한 후속 활동 수정</Label>
        <textarea
          value={selectedFollowUp} onChange={(e) => setSelectedFollowUp(e.target.value)}
          placeholder="실행할 후속 활동 내용을 입력해 주세요."
          rows={4}
          style={{ ...inputStyle(focused), resize: 'vertical' }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </SectionCard>
  );
}

// ─── Phase 6: 최종 결과 ───────────────────────────────────────────────────────
function Phase6({
  draft, plan, loading, error, onRetry,
}: {
  draft: string;
  plan: { plan: PlanItem[] } | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (loading) return <LoadingCard message="세특 초안과 탐구 계획서를 생성 중이에요... 30초 정도 소요됩니다." />;

  if (error) {
    return (
      <SectionCard style={{ background: T.errorSoft, border: `1px solid ${T.error}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.error, fontFamily: FONT, marginBottom: 16 }}>{error}</div>
        <button onClick={onRetry} style={{ padding: '10px 20px', borderRadius: 10, background: T.primary, color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          다시 시도
        </button>
      </SectionCard>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <span style={{ padding: '3px 9px', fontSize: 13, borderRadius: 5, background: '#D1FAE5', color: T.success, fontWeight: 700, fontFamily: FONT }}>완성</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '10px 0 0', fontFamily: FONT }}>최종 결과 확인</h2>
          <p style={{ fontSize: 15, color: T.textMuted, margin: '4px 0 0', fontFamily: FONT }}>완성된 세특 초안과 탐구 계획서입니다.</p>
        </div>
      </div>

      {/* Research Plan */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `2px solid ${T.indigo}`, paddingBottom: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>📋</span>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, fontFamily: FONT }}>탐구 계획서</h3>
        </div>
        {plan ? (
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: T.textMuted, width: '25%', fontFamily: FONT }}>구분</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: T.textMuted, fontFamily: FONT }}>내용</th>
                </tr>
              </thead>
              <tbody>
                {plan.plan.map((item, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: '14px 16px', background: '#EEF2FF', fontWeight: 700, color: '#3730A3', verticalAlign: 'top', whiteSpace: 'pre-line', fontFamily: FONT }}>{item.category}</td>
                    <td style={{ padding: '14px 16px', color: T.text, lineHeight: 1.65, fontFamily: FONT }}>
                      {item.isStepByStep && item.steps ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
                          {item.steps.map((s, j) => (
                            <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                              <div style={{
                                background: T.indigo, color: '#fff', fontSize: 10, fontWeight: 700,
                                padding: '3px 6px', borderRadius: 4, flexShrink: 0, marginTop: 2, fontFamily: FONT,
                              }}>
                                {s.step}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3, fontFamily: FONT }}>{s.title}</div>
                                <div style={{ fontSize: 13, color: T.textMuted, fontFamily: FONT }}>{s.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{item.content}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 20, borderRadius: 12, background: T.bgAlt, color: T.textSubtle, fontSize: 15, fontFamily: FONT, textAlign: 'center' }}>계획서 데이터 없음</div>
        )}
      </div>

      {/* SeTeuk Draft */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.emerald}`, paddingBottom: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, fontFamily: FONT }}>세특 초안 (교사 관점)</h3>
          </div>
          <button onClick={handleCopy} style={{
            padding: '8px 14px', borderRadius: 8,
            background: copied ? '#D1FAE5' : T.bgAlt,
            color: copied ? T.success : T.text,
            border: `1px solid ${copied ? T.success : T.borderStrong}`,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          }}>
            {copied ? '✓ 복사됨' : '세특 초안 복사'}
          </button>
        </div>
        <div style={{ background: '#F0FDF4', border: `1px solid #BBF7D0`, borderRadius: 12, padding: '20px 22px', fontSize: 15, color: T.text, lineHeight: 1.9, fontFamily: FONT, fontStyle: 'italic' }}>
          {draft || '세특 초안이 없습니다.'}
        </div>
        <div style={{ fontSize: 13, color: T.textSubtle, marginTop: 8, textAlign: 'right', fontFamily: FONT }}>
          총 {draft.length}자
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Service4Seteuk() {
  const { currentStudent, updateStudent, segibuAnalysis } = useStudent();
  const [phase, setPhase] = useState<Phase>(1);

  const [major, setMajor] = useState('');
  const [interest, setInterest] = useState('');
  const [activities, setActivities] = useState('');

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');

  const [motivations, setMotivations] = useState<MotivationItem[]>([]);
  const [motivationsLoading, setMotivationsLoading] = useState(false);
  const [selectedMotivation, setSelectedMotivation] = useState('');

  const [competencies, setCompetencies] = useState<CompetencyItem[]>([]);
  const [competenciesLoading, setCompetenciesLoading] = useState(false);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);

  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState('');

  const [draft, setDraft] = useState('');
  const [plan, setPlan] = useState<{ plan: PlanItem[] } | null>(null);
  const [finalLoading, setFinalLoading] = useState(false);
  const [finalError, setFinalError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [subjectHints, setSubjectHints] = useState<string[]>([]);
  const restoredRef = useRef(false);

  const naesinData = useMemo(() => getNaesinData(currentStudent?.naesin_data), [currentStudent?.naesin_data]);
  const targetPick = useMemo(() => getPrimaryTargetPick(getUniversityPicks(naesinData)), [naesinData]);
  const savedSeteukRecords = useMemo(() => getSeteukRecords(naesinData), [naesinData]);
  const readinessWeaknesses = useMemo(() => segibuAnalysis?.admissionsReadiness?.criticalWeaknesses ?? [], [segibuAnalysis]);
  const effectiveMajor = major || currentStudent?.target_dept || '';
  const targetLabel = useMemo(() => getTargetLabel(targetPick, currentStudent?.target_dept ?? ''), [currentStudent?.target_dept, targetPick]);
  const remediationSuggestions = useMemo(() => (
    buildRemediationSuggestions(readinessWeaknesses, targetPick, currentStudent?.target_dept ?? '', subjectHints)
  ), [currentStudent?.target_dept, readinessWeaknesses, subjectHints, targetPick]);
  const storageKeys = useMemo(() => getStorageKeys(currentStudent?.id), [currentStudent?.id]);

  // Load from per-student localStorage
  useEffect(() => {
    restoredRef.current = false;
    const timer = window.setTimeout(() => {
      setPhase(1);
      setMajor('');
      setInterest('');
      setActivities('');
      setTopics([]);
      setSelectedTopic('');
      setMotivations([]);
      setSelectedMotivation('');
      setCompetencies([]);
      setSelectedCompetencies([]);
      setFollowUps([]);
      setSelectedFollowUp('');
      setDraft('');
      setPlan(null);
      setFinalError(null);
      setSaveMessage(null);

      const saved = localStorage.getItem(storageKeys.data);
      const savedPhase = localStorage.getItem(storageKeys.phase);
      if (saved) {
        try {
          const d = JSON.parse(saved) as SavedSeteukData;
          if (d.major) setMajor(d.major);
          if (d.interest) setInterest(d.interest);
          if (d.activities) setActivities(d.activities);
          if (d.topics) setTopics(d.topics);
          if (d.selectedTopic) setSelectedTopic(d.selectedTopic);
          if (d.motivations) setMotivations(d.motivations);
          if (d.selectedMotivation) setSelectedMotivation(d.selectedMotivation);
          if (d.competencies) setCompetencies(d.competencies);
          if (d.selectedCompetencies) setSelectedCompetencies(d.selectedCompetencies);
          if (d.followUps) setFollowUps(d.followUps);
          if (d.selectedFollowUp) setSelectedFollowUp(d.selectedFollowUp);
          if (d.draft) setDraft(d.draft);
          if (d.plan) setPlan(d.plan);
        } catch { /* ignore */ }
      }
      if (savedPhase) {
        const nextPhase = Number(savedPhase);
        if (nextPhase >= 1 && nextPhase <= 6) setPhase(nextPhase as Phase);
      }
      restoredRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKeys]);

  // Save to per-student localStorage
  useEffect(() => {
    if (!restoredRef.current) return;
    localStorage.setItem(storageKeys.data, JSON.stringify({
      major: effectiveMajor, interest, activities,
      topics, selectedTopic,
      motivations, selectedMotivation,
      competencies, selectedCompetencies,
      followUps, selectedFollowUp,
      draft, plan,
    }));
    localStorage.setItem(storageKeys.phase, phase.toString());
  }, [effectiveMajor, interest, activities, topics, selectedTopic, motivations, selectedMotivation, competencies, selectedCompetencies, followUps, selectedFollowUp, draft, plan, phase, storageKeys]);

  useEffect(() => {
    const university = targetPick?.name ?? '';
    const majorQuery = targetPick?.dept || currentStudent?.target_dept || '';
    if (!university && !majorQuery) {
      const timer = window.setTimeout(() => setSubjectHints([]), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const params = new URLSearchParams();
    if (university) params.set('university', university);
    if (majorQuery) params.set('major', majorQuery);
    params.set('limit', '6');

    fetch(`/api/recommended-subjects?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data: { results?: UniversitySubjectRecord[] } = await res.json();
        if (!cancelled) setSubjectHints(collectSubjectHints(data.results ?? []));
      })
      .catch(() => {
        if (!cancelled) setSubjectHints([]);
      });

    return () => { cancelled = true; };
  }, [currentStudent?.target_dept, targetPick?.dept, targetPick?.name]);

  const toggleCompetency = (key: string) => {
    setSelectedCompetencies(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  async function fetchTopics(majorVal: string, interestVal: string, activitiesVal: string) {
    setTopicsLoading(true);
    try {
      const res = await fetch(`/api/analyze/seteuk?action=topics&major=${encodeURIComponent(majorVal)}&interest=${encodeURIComponent(interestVal)}&activities=${encodeURIComponent(activitiesVal)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch { /* stay on loading=false */ }
    finally { setTopicsLoading(false); }
  }

  async function fetchMotivations(topic: string) {
    setMotivationsLoading(true);
    try {
      const res = await fetch(`/api/analyze/seteuk?action=motivations&topic=${encodeURIComponent(topic)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMotivations(data.motivations ?? []);
      setSelectedMotivation('');
    } catch { /* noop */ }
    finally { setMotivationsLoading(false); }
  }

  async function fetchCompetencies(topic: string) {
    setCompetenciesLoading(true);
    try {
      const res = await fetch(`/api/analyze/seteuk?action=competencies&topic=${encodeURIComponent(topic)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompetencies(data.competencies ?? []);
      setSelectedCompetencies([]);
    } catch { /* noop */ }
    finally { setCompetenciesLoading(false); }
  }

  async function fetchFollowUps(topic: string) {
    setFollowUpsLoading(true);
    try {
      const res = await fetch(`/api/analyze/seteuk?action=followups&topic=${encodeURIComponent(topic)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowUps(data.followUps ?? []);
      setSelectedFollowUp('');
    } catch { /* noop */ }
    finally { setFollowUpsLoading(false); }
  }

  async function saveSeteukResult(nextDraft: string, nextPlan: { plan: PlanItem[] } | null) {
    if (!currentStudent || !nextDraft.trim()) {
      setSaveMessage(currentStudent ? null : '학생을 선택하면 결과가 저장됩니다.');
      return;
    }

    const context = {
      targetUniversity: targetPick?.name,
      targetDept: targetPick?.dept || effectiveMajor,
      weaknesses: readinessWeaknesses.map((item) => `${item.issue}: ${item.recommendation}`),
      subjectHints,
    };

    const record: SeteukRecord = {
      id: createRecordId(),
      savedAt: new Date().toISOString(),
      major: effectiveMajor,
      interest,
      activities,
      selectedTopic,
      selectedMotivation,
      selectedCompetencies,
      selectedFollowUp,
      draft: nextDraft,
      plan: nextPlan,
      oneLineFeedback: buildOneLineFeedback(selectedTopic, readinessWeaknesses),
      context,
    };

    const nextRecords = [
      record,
      ...savedSeteukRecords.filter((item) => item.id !== record.id),
    ].slice(0, 5);
    const updated = await updateStudent(currentStudent.id, {
      naesin_data: {
        ...getNaesinData(currentStudent.naesin_data),
        seteuk_records: nextRecords,
        seteuk_latest: record,
      },
    });
    setSaveMessage(updated ? '학생별 세특 결과 저장 완료' : '학생별 저장 실패. 다시 생성해 주세요.');
  }

  async function fetchFinal() {
    setFinalLoading(true);
    setFinalError(null);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/analyze/seteuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          major: effectiveMajor, interest, topic: selectedTopic,
          motivation: selectedMotivation,
          competencies: selectedCompetencies,
          followUp: selectedFollowUp,
          activities,
          targetUniversity: targetPick?.name,
          targetDept: targetPick?.dept || effectiveMajor,
          weaknesses: readinessWeaknesses.map((item) => `${item.issue}: ${item.recommendation}`),
          subjectHints,
        }),
      });
      if (!res.ok) throw new Error('서버 오류');
      const data = await res.json();
      const nextDraft = data.draft ?? '';
      const nextPlan = data.plan ?? null;
      setDraft(nextDraft);
      setPlan(nextPlan);
      await saveSeteukResult(nextDraft, nextPlan);
    } catch {
      setFinalError('세특 생성 실패. 다시 시도해주세요.');
    } finally {
      setFinalLoading(false);
    }
  }

  const handleNext = async () => {
    if (phase === 1) {
      if (topics.length === 0) await fetchTopics(effectiveMajor, interest, activities);
      setPhase(2);
    } else if (phase === 2) {
      if (motivations.length === 0) await fetchMotivations(selectedTopic);
      setPhase(3);
    } else if (phase === 3) {
      if (competencies.length === 0) await fetchCompetencies(selectedTopic);
      setPhase(4);
    } else if (phase === 4) {
      if (followUps.length === 0) await fetchFollowUps(selectedTopic);
      setPhase(5);
    } else if (phase === 5) {
      setPhase(6);
      await fetchFinal();
    }
  };

  const handleBack = () => {
    if (phase > 1) setPhase((p) => (p - 1) as Phase);
  };

  const applySuggestion = (suggestion: SeteukSuggestion) => {
    if (!major.trim()) setMajor(targetPick?.dept || currentStudent?.target_dept || '');
    setInterest(suggestion.interest);
    setActivities(suggestion.activities);
    setTopics([]);
    setSelectedTopic('');
    setMotivations([]);
    setSelectedMotivation('');
    setCompetencies([]);
    setSelectedCompetencies([]);
    setFollowUps([]);
    setSelectedFollowUp('');
    setDraft('');
    setPlan(null);
    setFinalError(null);
    setSaveMessage('보완 후보를 입력에 적용했습니다.');
    setPhase(1);
  };

  const loadSeteukRecord = (record: SeteukRecord) => {
    setMajor(record.major);
    setInterest(record.interest);
    setActivities(record.activities);
    setSelectedTopic(record.selectedTopic);
    setSelectedMotivation(record.selectedMotivation);
    setSelectedCompetencies(record.selectedCompetencies);
    setSelectedFollowUp(record.selectedFollowUp);
    setDraft(record.draft);
    setPlan(record.plan);
    setTopics([]);
    setMotivations([]);
    setCompetencies([]);
    setFollowUps([]);
    setFinalError(null);
    setSaveMessage(record.oneLineFeedback);
    setPhase(6);
  };

  const handleReset = () => {
    if (!confirm('모든 내용이 초기화됩니다. 계속하시겠습니까?')) return;
    setPhase(1);
    setMajor(currentStudent?.target_dept ?? '');
    setInterest(''); setActivities('');
    setTopics([]); setSelectedTopic('');
    setMotivations([]); setSelectedMotivation('');
    setCompetencies([]); setSelectedCompetencies([]);
    setFollowUps([]); setSelectedFollowUp('');
    setDraft(''); setPlan(null); setFinalError(null); setSaveMessage(null);
    localStorage.removeItem(storageKeys.data);
    localStorage.removeItem(storageKeys.phase);
  };

  const canNext = () => {
    if (phase === 1) return effectiveMajor.trim().length > 0 && interest.trim().length > 0 && !topicsLoading;
    if (phase === 2) return selectedTopic.trim().length > 0;
    if (phase === 3) return selectedMotivation.trim().length > 0;
    if (phase === 4) return selectedCompetencies.length > 0;
    if (phase === 5) return selectedFollowUp.trim().length > 0;
    return false;
  };

  const isAnyLoading = topicsLoading || motivationsLoading || competenciesLoading || followUpsLoading;

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <Sidebar phase={phase} onReset={handleReset} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {phase === 1 && (
          <>
            <RemediationPanel
              suggestions={remediationSuggestions}
              onApplySuggestion={applySuggestion}
              savedRecords={savedSeteukRecords}
              onLoadRecord={loadSeteukRecord}
              targetLabel={targetLabel}
              subjectHints={subjectHints}
            />
            <Phase1
              major={effectiveMajor} setMajor={setMajor}
              interest={interest} setInterest={setInterest}
              activities={activities} setActivities={setActivities}
              onNext={handleNext} loading={topicsLoading}
            />
          </>
        )}
        {phase === 2 && (
          <Phase2
            topics={topics} loading={topicsLoading}
            selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic}
            onRefresh={() => fetchTopics(effectiveMajor, interest, activities)}
            onNext={handleNext}
          />
        )}
        {phase === 3 && (
          <Phase3
            motivations={motivations} loading={motivationsLoading}
            selectedMotivation={selectedMotivation} setSelectedMotivation={setSelectedMotivation}
            onRefresh={() => fetchMotivations(selectedTopic)}
          />
        )}
        {phase === 4 && (
          <Phase4
            competencies={competencies} loading={competenciesLoading}
            selectedCompetencies={selectedCompetencies}
            onToggle={toggleCompetency}
            onRefresh={() => fetchCompetencies(selectedTopic)}
          />
        )}
        {phase === 5 && (
          <Phase5
            followUps={followUps} loading={followUpsLoading}
            selectedFollowUp={selectedFollowUp} setSelectedFollowUp={setSelectedFollowUp}
            onRefresh={() => fetchFollowUps(selectedTopic)}
          />
        )}
        {phase === 6 && (
          <>
            <Phase6
              draft={draft} plan={plan}
              loading={finalLoading} error={finalError}
              onRetry={fetchFinal}
            />
            {saveMessage && (
              <div style={{
                marginTop: 12, padding: '12px 14px', borderRadius: 10,
                background: saveMessage.includes('완료') ? T.successSoft : T.bgAlt,
                border: `1px solid ${saveMessage.includes('완료') ? '#86EFAC' : T.border}`,
                color: saveMessage.includes('완료') ? T.success : T.textMuted,
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
              }}>
                {saveMessage}
              </div>
            )}
          </>
        )}

        {/* Bottom navigation (phases 3,4,5) */}
        {phase >= 3 && phase <= 5 && !isAnyLoading && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleBack} style={{
              height: 48, padding: '0 24px', borderRadius: 10,
              background: T.bgAlt, color: T.textMuted, border: `1px solid ${T.border}`,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
            }}>
              이전 단계
            </button>
            <button onClick={handleNext} disabled={!canNext()} style={{
              flex: 1, height: 48, borderRadius: 10,
              background: canNext() ? T.indigo : T.bgAlt,
              color: canNext() ? '#fff' : T.textSubtle,
              border: 'none', fontSize: 16, fontWeight: 700,
              cursor: canNext() ? 'pointer' : 'not-allowed', fontFamily: FONT,
            }}>
              {phase === 5 ? 'AI 최종 생성하기' : '다음 단계로'}
            </button>
          </div>
        )}

        {/* Back button on phase 2 */}
        {phase === 2 && (
          <button onClick={handleBack} style={{
            height: 44, padding: '0 24px', borderRadius: 10, marginTop: 16,
            background: T.bgAlt, color: T.textMuted, border: `1px solid ${T.border}`,
            fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, alignSelf: 'flex-start',
          }}>
            이전 단계
          </button>
        )}

        <TipsSection phase={phase} />
      </div>
    </div>
  );
}
