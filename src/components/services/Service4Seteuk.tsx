'use client';
import { useState } from 'react';

const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  accent: '#F59E0B', accentSoft: '#FEF3C7',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  comp: {
    academic: { color: '#1B64DA', soft: '#EBF2FF', border: '#CFDFFB' },
    career:   { color: '#D97706', soft: '#FEF3C7', border: '#FCD89A' },
    community:{ color: '#059669', soft: '#D1FAE5', border: '#A7F3D0' },
  },
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";
type Step = 1 | 2 | 3 | 4 | 5 | 6;

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
        {/* track */}
        <div style={{ position: 'absolute', top: 17, left: 18, right: 18, height: 2, background: T.bgAlt, borderRadius: 1 }} />
        {/* fill */}
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

// ─── Topics (step 2) ──────────────────────────────────────────────────────────
const TOPICS = [
  { t: 'mRNA 백신의 작동 원리와 한국 제약산업의 가능성', tags: ['생명과학Ⅱ', '의료·제약', '시사'], fit: 94, chosen: true },
  { t: '항생제 내성 박테리아 확산 메커니즘과 대응 전략', tags: ['생명과학Ⅰ', '의학·미생물학'], fit: 89, chosen: false },
  { t: '장내 미생물 생태계가 면역체계에 미치는 영향', tags: ['생명과학Ⅱ', '의학·영양'], fit: 85, chosen: false },
];

function Step2Topics({ onNext }: { onNext: () => void }) {
  const [chosen, setChosen] = useState(0);
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: FONT }}>AI 추천 탐구 주제</h2>
      <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 20px', letterSpacing: '-0.01em', fontFamily: FONT }}>의예과·생명과학Ⅱ 조합으로 생성한 맞춤 주제예요. 하나를 선택하거나 직접 입력하세요.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {TOPICS.map((topic, i) => {
          const isChosen = i === chosen;
          return (
            <div key={i} onClick={() => setChosen(i)} style={{
              padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
              background: isChosen ? T.primarySoft : T.surfaceAlt,
              border: `1.5px solid ${isChosen ? T.primary : T.border}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.4, marginBottom: 10, fontFamily: FONT }}>{topic.t}</div>
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
      <button onClick={onNext} style={{ width: '100%', height: 48, borderRadius: 10, background: T.primary, color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, letterSpacing: '-0.01em' }}>
        이 주제로 시작하기
      </button>
    </div>
  );
}

// ─── Step 6 final output ──────────────────────────────────────────────────────
const SETEUK_DRAFT = `생명과학Ⅱ 수업 중 mRNA 백신에 흥미를 느껴, 백신이 세포 내에서 항원 단백질을 생성하는 메커니즘을 자기주도적으로 탐구함. 화이자·모더나의 코로나19 백신 논문 2편을 원문 그대로 읽고 한국 제약사의 기술 격차를 분석하여 보고서로 제출함. 특히 지질 나노입자(LNP) 전달 시스템의 한국 내 생산 기반이 취약함을 밝히고, 관련 특허 분석을 통해 국내 제약산업의 방향을 제시함. 발표 후 친구들의 질문에 논리적으로 답하며 전공 지식을 확장하는 모습을 보임.`;

function Step6Final({ onReset }: { onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(SETEUK_DRAFT).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <span style={{ padding: '3px 9px', fontSize: 15, borderRadius: 5, background: T.successSoft, color: T.success, fontWeight: 700, fontFamily: FONT }}>완성</span>
          <h2 style={{ fontSize: 'clamp(19px, 2vw, 24px)', fontWeight: 800, color: T.text, letterSpacing: '-0.035em', margin: '10px 0 4px', lineHeight: 1.2, fontFamily: FONT }}>세특 초안 & 탐구 계획서</h2>
          <p style={{ fontSize: 17, color: T.textMuted, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT }}>주제 · mRNA 백신의 작동 원리와 한국 제약산업의 가능성</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={handleCopy} style={{ padding: '8px 14px', borderRadius: 8, background: copied ? T.successSoft : T.bgAlt, color: copied ? T.success : T.text, border: `1px solid ${copied ? T.success : T.borderStrong}`, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            {copied ? '✓ 복사됨' : '복사'}
          </button>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: T.primary, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Word 다운로드</button>
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.textMuted, letterSpacing: '-0.01em', margin: '0 0 10px', fontFamily: FONT }}>세특 문장 초안</h3>
        <div style={{ padding: 22, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 18, color: T.text, lineHeight: 1.95, letterSpacing: '-0.01em', fontFamily: FONT }}>
          {SETEUK_DRAFT}
        </div>
        <div style={{ fontSize: 14, color: T.textSubtle, marginTop: 8, textAlign: 'right', letterSpacing: '-0.01em', fontFamily: FONT }}>
          총 {SETEUK_DRAFT.length}자 · 생기부 500자 권장 이내
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.textMuted, letterSpacing: '-0.01em', margin: '0 0 10px', fontFamily: FONT }}>탐구 계획서</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', fontSize: 17 }}>
          <tbody>
            {[
              ['탐구 주제', 'mRNA 백신의 작동 원리와 한국 제약산업의 가능성'],
              ['연관 교과', '생명과학Ⅱ — 유전자 발현과 조절'],
              ['탐구 동기', 'COVID-19 경험을 통해 느낀 백신 주권의 중요성과 한국 산업 현실에 대한 궁금증'],
              ['탐구 방법', '① 논문 원문 독해 ② 국내 제약사 특허 분석 ③ 전문가 인터뷰'],
              ['예상 결과물', '보고서 1건 (A4 5매) + 동아리 세미나 발표 1회'],
              ['연계 역량', 'COMP'],
            ].map((row, i) => (
              <tr key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
                <td style={{ padding: '14px 18px', background: T.surfaceAlt, fontWeight: 700, color: T.text, width: 140, letterSpacing: '-0.01em', fontFamily: FONT }}>{row[0]}</td>
                <td style={{ padding: '14px 18px', color: T.text, lineHeight: 1.6, letterSpacing: '-0.01em', fontFamily: FONT }}>
                  {row[1] === 'COMP' ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(['학업역량', '진로역량', '탐구역량'] as const).map((label, j) => {
                        const keys = ['academic', 'career', 'community'] as const;
                        const cc = T.comp[keys[j]];
                        return <span key={j} style={{ padding: '3px 10px', fontSize: 15, borderRadius: 5, background: cc.soft, color: cc.color, fontWeight: 700, fontFamily: FONT }}>{label}</span>;
                      })}
                    </div>
                  ) : row[1]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={onReset} style={{ padding: '10px 20px', borderRadius: 10, background: T.bgAlt, color: T.textMuted, border: `1px solid ${T.border}`, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
        처음부터 다시
      </button>
    </div>
  );
}

// ─── Simple step panels ────────────────────────────────────────────────────────
function SimpleStep({ step }: { step: Step }) {
  const configs: Record<number, { title: string; desc: string; placeholder: string }> = {
    1: { title: '기본 정보 입력', desc: '탐구할 과목과 희망 학과를 선택해주세요.', placeholder: '과목명 (예: 생명과학Ⅱ)' },
    3: { title: '탐구 동기 확인', desc: '이 주제를 선택한 이유를 적어주세요.', placeholder: 'COVID-19 경험을 통해...' },
    4: { title: '연결 역량 확인', desc: '이 탐구가 어떤 역량과 연결되는지 생각해보세요.', placeholder: '학업역량 — 논문 분석...' },
    5: { title: '세특 초안 작성', desc: 'AI가 초안을 생성했어요. 직접 수정해보세요.', placeholder: SETEUK_DRAFT },
  };
  const c = configs[step] ?? configs[1];
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
      <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: FONT }}>{c.title}</h2>
      <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 20px', letterSpacing: '-0.01em', fontFamily: FONT }}>{c.desc}</p>
      <textarea defaultValue={step === 5 ? SETEUK_DRAFT : ''} placeholder={c.placeholder} rows={step === 5 ? 8 : 4} style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', fontSize: 17, color: T.text, background: T.surface, resize: 'vertical', fontFamily: FONT, lineHeight: 1.7, outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.target.style.borderColor = T.primary)} onBlur={(e) => (e.target.style.borderColor = T.border)} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Service4Seteuk() {
  const [step, setStep] = useState<Step>(1);
  const next = () => setStep(s => Math.min(s + 1, 6) as Step);
  const prev = () => setStep(s => Math.max(s - 1, 1) as Step);
  const reset = () => setStep(1);

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StepProgressBar current={step} />

      {step === 2 ? <Step2Topics onNext={next} /> : step === 6 ? <Step6Final onReset={reset} /> : <SimpleStep step={step} />}

      {step !== 2 && step !== 6 && (
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button onClick={prev} style={{ height: 44, padding: '0 24px', borderRadius: 10, background: T.bgAlt, color: T.textMuted, border: `1px solid ${T.border}`, fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>이전</button>
          )}
          <button onClick={next} style={{ flex: 1, height: 44, borderRadius: 10, background: T.primary, color: '#fff', border: 'none', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            {step === 5 ? 'AI 세특 생성하기' : '다음'}
          </button>
        </div>
      )}
    </div>
  );
}
