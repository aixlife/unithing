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

const WORDS = [
  { text: '탐구', size: 28 }, { text: '생명과학', size: 24 },
  { text: '자기주도', size: 22 }, { text: '의료윤리', size: 18 },
  { text: '협업', size: 20 }, { text: '의학', size: 26 },
  { text: '독서', size: 16 }, { text: '논리적', size: 18 },
  { text: '실험설계', size: 20 }, { text: '봉사', size: 15 },
  { text: 'DNA', size: 17 }, { text: '리더십', size: 22 },
  { text: '창의성', size: 18 }, { text: '분석력', size: 20 },
  { text: '끈기', size: 14 }, { text: '연구', size: 18 },
];

function WordCloud() {
  const colors = [T.primary, T.text, T.textMuted, T.primary, T.text, T.textMuted];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center', justifyContent: 'center', padding: '12px 8px' }}>
      {WORDS.map((w, i) => (
        <span key={i} style={{ fontSize: w.size, fontWeight: w.size > 20 ? 800 : 600, color: colors[i % colors.length], letterSpacing: '-0.03em', lineHeight: 1, opacity: w.size > 22 ? 1 : 0.75, fontFamily: FONT }}>{w.text}</span>
      ))}
    </div>
  );
}

const REPORT_SECTIONS = [
  {
    num: 1, title: '학업 성취', compKey: 'academic' as CompKey,
    good: '내신 평균 1.38등급 · 생명과학Ⅰ·Ⅱ 전 학기 A+ · 학기별 편차 최소',
    fix: '세특 서술이 교과서 수준에 그침 — 사고 과정과 새로운 발견이 드러나야 함',
  },
  {
    num: 2, title: '진로 일관성', compKey: 'career' as CompKey,
    good: '1~3학년 생명과학·의학 관심 지속 확장 · mRNA 백신 심화탐구 · 논문 독해 동아리 창설',
    fix: '의료윤리 관련 독서 활동이 1학년 이후 끊김 — 연속성 보완 필요',
  },
  {
    num: 3, title: '보완 제안', compKey: 'community' as CompKey,
    good: '봉사 120시간(3년) · 동아리 부장 · 모의UN 공동 발의',
    fix: '봉사의 질적 전환 · 영어 논문 세특 반영 · 수학 탐구 보고서 1건 추가',
  },
];

const SUGGESTIONS = [
  { title: '의료윤리 독서', desc: '「침묵의 소리」·「의사의 길」추천', c: 'community' as CompKey },
  { title: '수학 탐구 심화', desc: '확률·통계 탐구 보고서 1건 추가', c: 'academic' as CompKey },
  { title: '영어 논문 세특 반영', desc: '동아리 활동을 수치로 세특에 기록', c: 'career' as CompKey },
  { title: '봉사 질적 전환', desc: '의료·보건 맞춤형 봉사로 전환', c: 'community' as CompKey },
];

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

  if (!analyzed) {
    return (
      <div style={{ fontFamily: FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, maxWidth: 560, margin: '40px auto' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6, fontFamily: FONT }}>학생부 PDF 업로드</div>
        <div style={{ fontSize: 16, color: T.textMuted, marginBottom: 20, fontFamily: FONT }}>업로드하면 AI가 종합 분석 리포트를 생성해드려요.</div>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setFile(f); }}
          style={{ border: `2px dashed ${dragOver ? T.primary : T.borderStrong}`, borderRadius: 12, padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: dragOver ? T.primarySoft : T.bgAlt, transition: 'all 0.15s' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={T.textSubtle} strokeWidth="1.8" fill="none"/>
            <polyline points="14 2 14 8 20 8" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="12" y1="18" x2="12" y2="12" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
            <polyline points="9 15 12 12 15 15" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.textMuted, fontFamily: FONT }}>{file ? file.name : '학생부 PDF를 끌어다 놓거나 클릭해 선택'}</div>
          <div style={{ fontSize: 14, color: T.textSubtle, fontFamily: FONT }}>최대 10MB · PDF만 가능</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        <button onClick={handleAnalyze} disabled={!file || loading} style={{ marginTop: 16, width: '100%', height: 48, borderRadius: 10, background: file && !loading ? T.primary : T.bgAlt, color: file && !loading ? '#fff' : T.textSubtle, border: 'none', fontSize: 16, fontWeight: 700, cursor: file && !loading ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
          {loading ? '분석 중...' : 'AI 분석 시작'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header row — compact */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ padding: '2px 8px', fontSize: 13, borderRadius: 4, background: T.bgAlt, color: T.textMuted, fontWeight: 600, fontFamily: FONT }}>학생부 리포트</span>
            <span style={{ padding: '2px 8px', fontSize: 13, borderRadius: 4, background: T.successSoft, color: T.success, fontWeight: 600, fontFamily: FONT }}>분석 완료</span>
            <span style={{ fontSize: 13, color: T.textSubtle, fontFamily: FONT }}>2026.04.17 · AI 신뢰도 94%</span>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.035em', color: T.text, margin: 0, lineHeight: 1.2, fontFamily: FONT }}>
            김지우 학생의 학생부 종합 분석
          </h1>
        </div>
        <button onClick={() => { setAnalyzed(false); setFile(null); }} style={{ padding: '7px 14px', borderRadius: 8, background: 'transparent', color: T.text, border: `1px solid ${T.borderStrong}`, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>다시 업로드</button>
      </div>

      {/* Main grid: 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 12 }}>

        {/* Left: word cloud + suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Word cloud */}
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '16px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT }}>핵심 키워드</div>
              <div style={{ fontSize: 12, color: T.textSubtle, fontFamily: FONT }}>3년 생기부 빈도순</div>
            </div>
            <WordCloud />
          </div>

          {/* Suggestions grid */}
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', marginBottom: 10, fontFamily: FONT }}>보완 제안</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => {
                const cc = T.comp[s.c];
                return (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderLeft: `3px solid ${cc.color}` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 3, fontFamily: FONT }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, fontFamily: FONT }}>{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: 3 report sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REPORT_SECTIONS.map((s) => {
            const c = T.comp[s.compKey];
            return (
              <div key={s.num} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '16px 20px', position: 'relative', overflow: 'hidden', flex: 1 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: c.soft, color: c.color, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT }}>{s.title}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: c.soft, borderLeft: `3px solid ${c.color}`, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.color, letterSpacing: '0.05em', marginBottom: 4, fontFamily: FONT }}>강점</div>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, fontFamily: FONT }}>{s.good}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: T.dangerSoft, borderLeft: `3px solid ${T.danger}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.danger, letterSpacing: '0.05em', marginBottom: 4, fontFamily: FONT }}>보완</div>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, fontFamily: FONT }}>{s.fix}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
