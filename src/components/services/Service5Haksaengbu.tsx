'use client';
import { useState, useRef } from 'react';

const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  accent: '#F59E0B', accentSoft: '#FEF3C7',
  danger: '#DC2626', dangerSoft: '#FEE2E2',
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
type CompKey = 'academic' | 'career' | 'community';

// ─── Word cloud ───────────────────────────────────────────────────────────────
const WORDS = [
  { text: '탐구', size: 34 }, { text: '생명과학', size: 30 },
  { text: '자기주도', size: 28 }, { text: '의료윤리', size: 22 },
  { text: '협업', size: 24 }, { text: '의학', size: 32 },
  { text: '독서', size: 20 }, { text: '논리적', size: 22 },
  { text: '실험설계', size: 24 }, { text: '봉사', size: 18 },
  { text: 'DNA', size: 20 }, { text: '리더십', size: 26 },
  { text: '창의성', size: 22 }, { text: '발표', size: 18 },
  { text: '분석력', size: 24 }, { text: '끈기', size: 16 },
  { text: '논문', size: 19 }, { text: '연구', size: 22 },
];

function WordCloud() {
  const colors = [T.primary, T.text, T.textMuted, T.primary, T.text, T.textMuted];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', alignItems: 'center', justifyContent: 'center', padding: '24px 10px', minHeight: 180 }}>
      {WORDS.map((w, i) => (
        <span key={i} style={{ fontSize: w.size, fontWeight: w.size > 22 ? 800 : 600, color: colors[i % colors.length], letterSpacing: '-0.03em', lineHeight: 1, opacity: w.size > 24 ? 1 : 0.75, fontFamily: FONT }}>{w.text}</span>
      ))}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionH({ num, title, compKey }: { num: number; title: string; compKey: CompKey }) {
  const c = T.comp[compKey];
  return (
    <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.025em', margin: '28px 0 12px', paddingBottom: 10, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT }}>
      <span style={{ width: 22, height: 22, borderRadius: 6, background: c.soft, color: c.color, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{num}</span>
      {title}
    </h3>
  );
}

// ─── Report content ───────────────────────────────────────────────────────────
function ReportContent() {
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 32 }}>
      <h2 style={{ fontSize: 'clamp(18px, 2vw, 22px)', fontWeight: 800, color: T.text, letterSpacing: '-0.035em', margin: '0 0 6px', fontFamily: FONT }}>종합 분석 리포트</h2>
      <div style={{ fontSize: 15, color: T.textMuted, marginBottom: 24, letterSpacing: '-0.01em', fontFamily: FONT }}>
        분석일 2026.04.17 · 총 42페이지 분석 · AI 신뢰도 94%
      </div>

      {/* Section 1 */}
      <SectionH num={1} title="학업 성취 분석" compKey="academic" />
      <p style={{ fontSize: 18, color: T.text, lineHeight: 1.8, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: FONT }}>
        김지우 학생은 3년간 내신 평균 <strong>1.38등급</strong>을 유지하며 학업 성취도가 매우 우수합니다.
        특히 <strong>생명과학Ⅰ·Ⅱ 전 학기 A+</strong>, 수학 계열 과목에서도 꾸준한 상승세를 보입니다.
      </p>
      <div style={{ margin: '14px 0', padding: '16px 18px', borderRadius: 10, background: T.comp.academic.soft, borderLeft: `3px solid ${T.comp.academic.color}`, fontSize: 17, color: T.text, lineHeight: 1.7, letterSpacing: '-0.01em', fontFamily: FONT }}>
        <strong style={{ color: T.comp.academic.color }}>주목할 점</strong> — 자연계열 핵심 과목의 성취도가 일관되게 상위권에 위치해 있으며, 학기별 편차가 적어 학업 안정성이 높게 평가됩니다.
      </div>
      <div style={{ margin: '14px 0', padding: '16px 18px', borderRadius: 10, background: T.dangerSoft, borderLeft: `3px solid ${T.danger}`, fontSize: 17, color: T.text, lineHeight: 1.7, letterSpacing: '-0.01em', fontFamily: FONT }}>
        <strong style={{ color: T.danger }}>비판적 관점</strong> — 세특 서술이 교과서 수준에 그치는 경우가 많습니다. "탐구했다"는 사실 나열보다 사고 과정과 새로운 발견이 드러나야 합니다.
      </div>

      {/* Section 2 */}
      <SectionH num={2} title="진로 일관성" compKey="career" />
      <p style={{ fontSize: 18, color: T.text, lineHeight: 1.8, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: FONT }}>
        1학년부터 3학년까지 생명과학·의학 분야에 대한 관심이 <strong>지속적으로 확장</strong>되는 모습이 관찰됩니다.
        단순한 호기심에서 구체적인 탐구로 발전하는 궤적이 뚜렷합니다.
      </p>
      <ul style={{ fontSize: 17, color: T.text, lineHeight: 1.9, paddingLeft: 20, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: FONT }}>
        <li><strong>1학년</strong> — 교내 과학동아리 가입, 생명과학 개론 독서 활동</li>
        <li><strong>2학년</strong> — 동아리 내 DNA 복제 메커니즘 발표 주도</li>
        <li><strong>3학년</strong> — mRNA 백신 심화 탐구, 의학 논문 원문 독해 동아리 창설</li>
      </ul>

      {/* Section 3 */}
      <SectionH num={3} title="보완 제안" compKey="community" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 10 }}>
        {[
          { title: '의료윤리 독서 활동', desc: '1학년 이후 관련 독서 기록이 부족합니다. 「침묵의 소리」·「의사의 길」등 추천', c: 'community' as CompKey },
          { title: '수학 탐구 심화', desc: '확률과 통계 관련 탐구 보고서 1건 추가를 권장합니다.', c: 'academic' as CompKey },
          { title: '영어 논문 활용', desc: '이미 시작한 논문 독해 동아리 활동을 세특에 구체적 수치로 반영하면 좋겠어요.', c: 'career' as CompKey },
          { title: '봉사의 질적 전환', desc: '단순 봉사시간 누적에서 의료·보건 관련 맞춤형 봉사로 전환을 추천합니다.', c: 'community' as CompKey },
        ].map((it, i) => {
          const cc = T.comp[it.c];
          return (
            <div key={i} style={{ padding: 16, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderLeft: `3px solid ${cc.color}` }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: '-0.015em', marginBottom: 6, fontFamily: FONT }}>{it.title}</div>
              <div style={{ fontSize: 16, color: T.textMuted, lineHeight: 1.6, letterSpacing: '-0.01em', fontFamily: FONT }}>{it.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Service5Haksaengbu() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzed, setAnalyzed] = useState(true);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = () => {
    if (!file) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setAnalyzed(true); }, 2000);
  };

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!analyzed && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4, fontFamily: FONT }}>학생부 PDF 업로드</div>
          <div style={{ fontSize: 16, color: T.textMuted, marginBottom: 16, fontFamily: FONT }}>학생부를 업로드하면 AI가 종합 분석 리포트를 생성해드려요.</div>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setFile(f); }}
            style={{ border: `2px dashed ${dragOver ? T.primary : T.borderStrong}`, borderRadius: 12, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: dragOver ? T.primarySoft : T.bgAlt, transition: 'all 0.15s' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={T.textSubtle} strokeWidth="1.8" fill="none"/>
              <polyline points="14 2 14 8 20 8" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="12" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="9 15 12 12 15 15" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 17, fontWeight: 600, color: T.textMuted, fontFamily: FONT }}>{file ? file.name : '학생부 PDF를 여기에 끌어다 놓거나 클릭해 선택하세요'}</div>
            <div style={{ fontSize: 15, color: T.textSubtle, fontFamily: FONT }}>최대 10MB · PDF만 가능</div>
          </div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
          <button onClick={handleAnalyze} disabled={!file || loading} style={{ marginTop: 16, width: '100%', height: 48, borderRadius: 10, background: file && !loading ? T.primary : T.bgAlt, color: file && !loading ? '#fff' : T.textSubtle, border: 'none', fontSize: 15, fontWeight: 700, cursor: file && !loading ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
            {loading ? '분석 중...' : 'AI 분석 시작'}
          </button>
        </div>
      )}

      {analyzed && (
        <>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <span style={{ padding: '3px 9px', fontSize: 15, borderRadius: 5, background: T.bgAlt, color: T.textMuted, fontWeight: 600, fontFamily: FONT }}>서비스 5</span>
              <h1 style={{ fontSize: 'clamp(28px, 3.2vw, 44px)', fontWeight: 800, letterSpacing: '-0.035em', color: T.text, margin: '10px 0 4px', lineHeight: 1.2, fontFamily: FONT }}>학생부 종합 분석 리포트</h1>
              <p style={{ fontSize: 17, color: T.textMuted, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT }}>김지우 학생의 학생부를 깊이 분석한 종합 리포트예요.</p>
            </div>
            <button onClick={() => { setAnalyzed(false); setFile(null); }} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', color: T.text, border: `1px solid ${T.borderStrong}`, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>다시 업로드</button>
          </div>

          {/* Word cloud */}
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0, fontFamily: FONT }}>핵심 키워드</h2>
              <div style={{ fontSize: 15, color: T.textMuted, letterSpacing: '-0.01em', fontFamily: FONT }}>3년간 생기부 · 빈도순 추출</div>
            </div>
            <WordCloud />
          </div>

          {/* Report */}
          <ReportContent />
        </>
      )}
    </div>
  );
}
