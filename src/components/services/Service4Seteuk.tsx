'use client';
import { useState } from 'react';
import { useStudent } from '@/contexts/StudentContext';

const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  accent: '#F59E0B', accentSoft: '#FEF3C7',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  error: '#DC2626', errorSoft: '#FEF2F2',
  comp: {
    academic: { color: '#1B64DA', soft: '#EBF2FF', border: '#CFDFFB' },
    career:   { color: '#D97706', soft: '#FEF3C7', border: '#FCD89A' },
    community:{ color: '#059669', soft: '#D1FAE5', border: '#A7F3D0' },
  },
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";
type Step = 1 | 2 | 3 | 4 | 5 | 6;

type TopicItem = { title: string; tags: string[]; fit: number };
type PlanData = {
  subject: string;
  topic: string;
  motivation: string;
  method: string;
  output: string;
  competencies: string[];
};

const WIZARD_STEPS = [
  { id: 1, label: '기본정보', sub: '학과·과목 선택' },
  { id: 2, label: '주제추천', sub: 'AI 탐구 주제' },
  { id: 3, label: '동기확인', sub: '선정 이유' },
  { id: 4, label: '역량확인', sub: '연결 역량' },
  { id: 5, label: '세특초안', sub: '문장 초안' },
  { id: 6, label: '탐구계획서', sub: '최종 산출' },
] as const;

// ─── Step progress bar ─────────────────────────────────────────────────────────
function StepProgressBar({ current }: { current: Step }) {
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '26px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.textMuted, letterSpacing: '-0.01em', marginBottom: 4, fontFamily: FONT }}>세특 도우미</div>
          <div style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', fontFamily: FONT }}>단계 {current} / 6</div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 8, background: T.bgAlt, color: T.textMuted, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: FONT }}>
          예상 소요시간 약 {(6 - current) * 2}분
        </div>
      </div>

      <div style={{ position: 'relative', padding: '0 18px' }}>
        <div style={{ position: 'absolute', top: 17, left: 18, right: 18, height: 2, background: T.bgAlt, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: 17, left: 18, width: `${((current - 1) / 5) * 100}%`, height: 2, background: T.primary, borderRadius: 1 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          {WIZARD_STEPS.map((s) => {
            const done = s.id < current;
            const active = s.id === current;
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: active || done ? T.primary : T.surface,
                  border: `1.5px solid ${active || done ? T.primary : T.borderStrong}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: active || done ? '#fff' : T.textSubtle, fontWeight: 700, fontFamily: FONT,
                }}>
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : s.id}
                </div>
                <div style={{ marginTop: 10, fontSize: 16, fontWeight: active ? 700 : 500, color: active ? T.text : (done ? T.textMuted : T.textSubtle), letterSpacing: '-0.01em', fontFamily: FONT }}>{s.label}</div>
                <div style={{ fontSize: 14, color: T.textSubtle, marginTop: 2, letterSpacing: '-0.01em', fontFamily: FONT }}>{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: 기본 정보 입력 ────────────────────────────────────────────────────
function Step1Info({
  subject, setSubject, major, setMajor, onNext, loading,
}: {
  subject: string;
  setSubject: (v: string) => void;
  major: string;
  setMajor: (v: string) => void;
  onNext: () => void;
  loading: boolean;
}) {
  const canNext = subject.trim().length > 0 && major.trim().length > 0;
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: FONT }}>기본 정보 입력</h2>
      <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 24px', letterSpacing: '-0.01em', fontFamily: FONT }}>탐구할 과목과 희망 학과를 입력해주세요.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: T.textMuted, marginBottom: 6, fontFamily: FONT }}>과목명</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="예: 생명과학Ⅱ"
            style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', fontSize: 17, color: T.text, background: T.surface, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => (e.target.style.borderColor = T.primary)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: T.textMuted, marginBottom: 6, fontFamily: FONT }}>희망 학과</label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="예: 의예과"
            style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', fontSize: 17, color: T.text, background: T.surface, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => (e.target.style.borderColor = T.primary)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <button
          onClick={onNext}
          disabled={!canNext || loading}
          style={{
            width: '100%', height: 48, borderRadius: 10,
            background: canNext && !loading ? T.primary : T.bgAlt,
            color: canNext && !loading ? '#fff' : T.textSubtle,
            border: 'none', fontSize: 17, fontWeight: 700, cursor: canNext && !loading ? 'pointer' : 'not-allowed',
            fontFamily: FONT, letterSpacing: '-0.01em', transition: 'all 0.15s',
          }}
        >
          {loading ? 'AI 주제 추천 중...' : '다음'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: AI 주제 추천 ─────────────────────────────────────────────────────
function Step2Topics({
  topics, loading, error, chosenTopic, onChoose, onNext,
}: {
  topics: TopicItem[];
  loading: boolean;
  error: string | null;
  chosenTopic: string;
  onChoose: (title: string) => void;
  onNext: (title: string) => void;
}) {
  const [customTopic, setCustomTopic] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const effectiveTopic = useCustom ? customTopic : chosenTopic;

  if (loading) {
    return (
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: FONT, marginBottom: 8 }}>AI가 탐구 주제를 추천하는 중...</div>
        <div style={{ fontSize: 16, color: T.textMuted, fontFamily: FONT }}>10~20초 정도 소요될 수 있어요.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: T.errorSoft, borderRadius: 16, border: `1px solid ${T.error}`, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.error, fontFamily: FONT }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: FONT }}>AI 추천 탐구 주제</h2>
      <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 20px', letterSpacing: '-0.01em', fontFamily: FONT }}>입력하신 정보를 바탕으로 생성한 맞춤 주제예요. 하나를 선택하거나 직접 입력하세요.</p>

      {!useCustom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {topics.map((topic, i) => {
            const isChosen = topic.title === chosenTopic;
            return (
              <div key={i} onClick={() => onChoose(topic.title)} style={{
                padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
                background: isChosen ? T.primarySoft : T.surfaceAlt,
                border: `1.5px solid ${isChosen ? T.primary : T.border}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.4, marginBottom: 10, fontFamily: FONT }}>{topic.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {topic.tags.map((tag, j) => (
                        <span key={j} style={{ padding: '2px 8px', fontSize: 14, borderRadius: 4, background: T.bgAlt, color: T.textMuted, fontWeight: 600, fontFamily: FONT }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: isChosen ? T.primary : T.textMuted, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: FONT }}>
                      {topic.fit}<span style={{ fontSize: 11, fontWeight: 600, color: T.textSubtle, marginLeft: 1 }}>%</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.textSubtle, fontWeight: 500, fontFamily: FONT }}>적합도</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setUseCustom((v) => !v)}
        style={{ background: 'none', border: 'none', color: T.primary, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: '4px 0', marginBottom: 12, textDecoration: 'underline' }}
      >
        {useCustom ? '추천 주제에서 선택하기' : '주제를 직접 입력하기'}
      </button>

      {useCustom && (
        <textarea
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="탐구하고 싶은 주제를 직접 입력해주세요."
          rows={3}
          style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', fontSize: 17, color: T.text, background: T.surface, resize: 'vertical', fontFamily: FONT, lineHeight: 1.7, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
          onFocus={(e) => (e.target.style.borderColor = T.primary)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
      )}

      <button
        onClick={() => { if (effectiveTopic.trim()) onNext(effectiveTopic.trim()); }}
        disabled={!effectiveTopic.trim()}
        style={{
          width: '100%', height: 48, borderRadius: 10,
          background: effectiveTopic.trim() ? T.primary : T.bgAlt,
          color: effectiveTopic.trim() ? '#fff' : T.textSubtle,
          border: 'none', fontSize: 15, fontWeight: 700,
          cursor: effectiveTopic.trim() ? 'pointer' : 'not-allowed',
          fontFamily: FONT, letterSpacing: '-0.01em',
        }}
      >
        이 주제로 시작하기
      </button>
    </div>
  );
}

// ─── Step 3: 탐구 동기 ────────────────────────────────────────────────────────
function Step3Motivation({ motivation, setMotivation }: { motivation: string; setMotivation: (v: string) => void }) {
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: FONT }}>탐구 동기 확인</h2>
      <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 20px', letterSpacing: '-0.01em', fontFamily: FONT }}>이 주제를 선택한 이유를 적어주세요.</p>
      <textarea
        value={motivation}
        onChange={(e) => setMotivation(e.target.value)}
        placeholder="COVID-19 경험을 통해 백신 주권의 중요성을 느꼈고..."
        rows={4}
        style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', fontSize: 17, color: T.text, background: T.surface, resize: 'vertical', fontFamily: FONT, lineHeight: 1.7, outline: 'none', boxSizing: 'border-box' }}
        onFocus={(e) => (e.target.style.borderColor = T.primary)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </div>
  );
}

// ─── Step 4: 연결 역량 ────────────────────────────────────────────────────────
function Step4Competencies({ competencies, setCompetencies }: { competencies: string; setCompetencies: (v: string) => void }) {
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: FONT }}>연결 역량 확인</h2>
      <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 20px', letterSpacing: '-0.01em', fontFamily: FONT }}>이 탐구가 어떤 역량과 연결되는지 생각해보세요.</p>
      <textarea
        value={competencies}
        onChange={(e) => setCompetencies(e.target.value)}
        placeholder="학업역량 — 논문 분석 및 비교 능력, 진로역량 — 의료 분야 관심..."
        rows={4}
        style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', fontSize: 17, color: T.text, background: T.surface, resize: 'vertical', fontFamily: FONT, lineHeight: 1.7, outline: 'none', boxSizing: 'border-box' }}
        onFocus={(e) => (e.target.style.borderColor = T.primary)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </div>
  );
}

// ─── Step 5: 세특 초안 ────────────────────────────────────────────────────────
function Step5Draft({
  draft, onChange, loading, error, onRetry,
}: {
  draft: string;
  onChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: FONT, marginBottom: 8 }}>AI가 세특을 작성 중...</div>
        <div style={{ fontSize: 16, color: T.textMuted, fontFamily: FONT }}>10~20초 정도 소요될 수 있어요.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: T.errorSoft, borderRadius: 16, border: `1px solid ${T.error}`, padding: 28 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.error, fontFamily: FONT, marginBottom: 16 }}>{error}</div>
        <button
          onClick={onRetry}
          style={{ padding: '10px 20px', borderRadius: 10, background: T.primary, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: FONT }}>세특 초안 작성</h2>
      <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 20px', letterSpacing: '-0.01em', fontFamily: FONT }}>AI가 초안을 생성했어요. 직접 수정해보세요.</p>
      <textarea
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', fontSize: 17, color: T.text, background: T.surface, resize: 'vertical', fontFamily: FONT, lineHeight: 1.7, outline: 'none', boxSizing: 'border-box' }}
        onFocus={(e) => (e.target.style.borderColor = T.primary)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
      <div style={{ fontSize: 14, color: T.textSubtle, marginTop: 8, textAlign: 'right', letterSpacing: '-0.01em', fontFamily: FONT }}>
        {draft.length}자 · 생기부 500자 권장 이내
      </div>
    </div>
  );
}

// ─── Step 6: 최종 출력 ────────────────────────────────────────────────────────
function Step6Final({ draft, plan, onReset }: { draft: string; plan: PlanData | null; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <span style={{ padding: '3px 9px', fontSize: 15, borderRadius: 5, background: T.successSoft, color: T.success, fontWeight: 700, fontFamily: FONT }}>완성</span>
          <h2 style={{ fontSize: 'clamp(19px, 2vw, 24px)', fontWeight: 800, color: T.text, letterSpacing: '-0.035em', margin: '10px 0 4px', lineHeight: 1.2, fontFamily: FONT }}>세특 초안 & 탐구 계획서</h2>
          {plan && (
            <p style={{ fontSize: 17, color: T.textMuted, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT }}>주제 · {plan.topic}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={handleCopy} style={{ padding: '8px 14px', borderRadius: 8, background: copied ? T.successSoft : T.bgAlt, color: copied ? T.success : T.text, border: `1px solid ${copied ? T.success : T.borderStrong}`, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            {copied ? '✓ 복사됨' : '복사'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.textMuted, letterSpacing: '-0.01em', margin: '0 0 10px', fontFamily: FONT }}>세특 문장 초안</h3>
        <div style={{ padding: 22, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 18, color: T.text, lineHeight: 1.95, letterSpacing: '-0.01em', fontFamily: FONT }}>
          {draft || '세특 초안이 없습니다.'}
        </div>
        <div style={{ fontSize: 14, color: T.textSubtle, marginTop: 8, textAlign: 'right', letterSpacing: '-0.01em', fontFamily: FONT }}>
          총 {draft.length}자 · 생기부 500자 권장 이내
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.textMuted, letterSpacing: '-0.01em', margin: '0 0 10px', fontFamily: FONT }}>탐구 계획서</h3>
        {plan ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', fontSize: 17 }}>
            <tbody>
              {[
                ['탐구 주제', plan.topic],
                ['연관 교과', plan.subject],
                ['탐구 동기', plan.motivation],
                ['탐구 방법', plan.method],
                ['예상 결과물', plan.output],
                ['연계 역량', '__COMP__'],
              ].map((row, i) => (
                <tr key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
                  <td style={{ padding: '14px 18px', background: T.surfaceAlt, fontWeight: 700, color: T.text, width: 140, letterSpacing: '-0.01em', fontFamily: FONT }}>{row[0]}</td>
                  <td style={{ padding: '14px 18px', color: T.text, lineHeight: 1.6, letterSpacing: '-0.01em', fontFamily: FONT }}>
                    {row[1] === '__COMP__' ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {plan.competencies.map((comp, j) => {
                          const palette = [T.comp.academic, T.comp.career, T.comp.community];
                          const cc = palette[j % palette.length];
                          return (
                            <span key={j} style={{ padding: '3px 10px', fontSize: 15, borderRadius: 5, background: cc.soft, color: cc.color, fontWeight: 700, fontFamily: FONT }}>{comp}</span>
                          );
                        })}
                      </div>
                    ) : row[1]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 20, borderRadius: 12, background: T.bgAlt, color: T.textSubtle, fontSize: 16, fontFamily: FONT, textAlign: 'center' }}>계획서 데이터 없음</div>
        )}
      </div>

      <button onClick={onReset} style={{ padding: '10px 20px', borderRadius: 10, background: T.bgAlt, color: T.textMuted, border: `1px solid ${T.border}`, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
        처음부터 다시
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Service4Seteuk() {
  const { currentStudent } = useStudent();
  const [step, setStep] = useState<Step>(1);

  // Step 1 inputs
  const [subject, setSubject] = useState('');
  const [major, setMajor] = useState(currentStudent?.target_dept ?? '');

  // Step 2 state
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [chosenTopic, setChosenTopic] = useState('');

  // Step 3 & 4 inputs
  const [motivation, setMotivation] = useState('');
  const [competencies, setCompetencies] = useState('');

  // Step 5 & 6 state
  const [seteukDraft, setSeteukDraft] = useState('');
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, 6) as Step);
  const prev = () => setStep((s) => Math.max(s - 1, 1) as Step);
  const reset = () => {
    setStep(1);
    setSubject('');
    setMajor(currentStudent?.target_dept ?? '');
    setTopics([]);
    setTopicsError(null);
    setChosenTopic('');
    setMotivation('');
    setCompetencies('');
    setSeteukDraft('');
    setPlan(null);
    setDraftError(null);
  };

  const fetchTopics = async (subjectVal: string, majorVal: string) => {
    setTopicsLoading(true);
    setTopicsError(null);
    setTopics([]);
    try {
      const res = await fetch(`/api/analyze/seteuk?subject=${encodeURIComponent(subjectVal)}&major=${encodeURIComponent(majorVal)}`);
      if (!res.ok) throw new Error('서버 오류');
      const data: TopicItem[] = await res.json();
      setTopics(data);
      if (data.length > 0) setChosenTopic(data[0].title);
    } catch {
      setTopicsError('주제 추천 실패. 다시 시도해주세요.');
    } finally {
      setTopicsLoading(false);
    }
  };

  const fetchDraft = async () => {
    setDraftLoading(true);
    setDraftError(null);
    try {
      const res = await fetch('/api/analyze/seteuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, major, topic: chosenTopic, motivation, competencies }),
      });
      if (!res.ok) throw new Error('서버 오류');
      const data: { draft: string; plan: PlanData } = await res.json();
      setSeteukDraft(data.draft);
      setPlan(data.plan);
    } catch {
      setDraftError('세특 생성 실패. 다시 시도해주세요.');
    } finally {
      setDraftLoading(false);
    }
  };

  // Step 1 → Step 2 버튼
  const handleStep1Next = async () => {
    await fetchTopics(subject, major);
    next();
  };

  // Step 4 → Step 5 버튼
  const handleStep4Next = async () => {
    next();
    await fetchDraft();
  };

  const canStep3Next = motivation.trim().length > 0;
  const canStep4Next = competencies.trim().length > 0;

  const renderStep = () => {
    if (step === 1) {
      return (
        <Step1Info
          subject={subject}
          setSubject={setSubject}
          major={major}
          setMajor={setMajor}
          onNext={handleStep1Next}
          loading={topicsLoading}
        />
      );
    }
    if (step === 2) {
      return (
        <Step2Topics
          topics={topics}
          loading={topicsLoading}
          error={topicsError}
          chosenTopic={chosenTopic}
          onChoose={setChosenTopic}
          onNext={(t) => { setChosenTopic(t); next(); }}
        />
      );
    }
    if (step === 3) {
      return <Step3Motivation motivation={motivation} setMotivation={setMotivation} />;
    }
    if (step === 4) {
      return <Step4Competencies competencies={competencies} setCompetencies={setCompetencies} />;
    }
    if (step === 5) {
      return (
        <Step5Draft
          draft={seteukDraft}
          onChange={setSeteukDraft}
          loading={draftLoading}
          error={draftError}
          onRetry={fetchDraft}
        />
      );
    }
    if (step === 6) {
      return <Step6Final draft={seteukDraft} plan={plan} onReset={reset} />;
    }
    return null;
  };

  // 하단 버튼 표시 여부 및 동작
  const showBottomNav = step !== 1 && step !== 2 && step !== 6 && !(step === 5 && (draftLoading || !!draftError));

  const getNextLabel = () => {
    if (step === 4) return draftLoading ? '생성 중...' : 'AI 세특 생성하기';
    return '다음';
  };

  const handleNext = () => {
    if (step === 4) { handleStep4Next(); return; }
    next();
  };

  const canNext = () => {
    if (step === 3) return canStep3Next;
    if (step === 4) return canStep4Next && !draftLoading;
    return true;
  };

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StepProgressBar current={step} />
      {renderStep()}

      {showBottomNav && (
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button
              onClick={prev}
              style={{ height: 44, padding: '0 24px', borderRadius: 10, background: T.bgAlt, color: T.textMuted, border: `1px solid ${T.border}`, fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext()}
            style={{
              flex: 1, height: 44, borderRadius: 10,
              background: canNext() ? T.primary : T.bgAlt,
              color: canNext() ? '#fff' : T.textSubtle,
              border: 'none', fontSize: 17, fontWeight: 700,
              cursor: canNext() ? 'pointer' : 'not-allowed',
              fontFamily: FONT, transition: 'all 0.15s',
            }}
          >
            {getNextLabel()}
          </button>
        </div>
      )}
    </div>
  );
}
