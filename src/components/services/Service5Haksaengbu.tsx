'use client';
import { useStudent } from '@/contexts/StudentContext';
import { CompKey } from '@/types/analysis';

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

function WordCloud({ words }: { words: { text: string; size: number }[] }) {
  const colors = [T.primary, T.text, T.textMuted, T.primary, T.text, T.textMuted];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center', justifyContent: 'center', padding: '12px 8px' }}>
      {words.map((w, i) => (
        <span key={i} style={{ fontSize: w.size, fontWeight: w.size > 20 ? 800 : 600, color: colors[i % colors.length], letterSpacing: '-0.03em', lineHeight: 1, opacity: w.size > 22 ? 1 : 0.75, fontFamily: FONT }}>{w.text}</span>
      ))}
    </div>
  );
}

export function Service5Haksaengbu() {
  const { segibuAnalysis, currentStudent } = useStudent();

  // 생기부 분석 없음 안내 화면
  if (!segibuAnalysis) {
    return (
      <div style={{ fontFamily: FONT, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>먼저 생기부 분석이 필요해요</div>
        <div style={{ fontSize: 16, color: T.textMuted }}>
          상단의 <strong>생기부 분석</strong> 탭에서 PDF를 업로드하고 분석을 완료해주세요.
        </div>
      </div>
    );
  }

  const studentName = currentStudent?.name ?? segibuAnalysis.studentName;

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ padding: '3px 10px', fontSize: 14, borderRadius: 5, background: T.bgAlt, color: T.textMuted, fontWeight: 600, fontFamily: FONT }}>학생부 리포트</span>
            <span style={{ padding: '3px 10px', fontSize: 14, borderRadius: 5, background: T.successSoft, color: T.success, fontWeight: 600, fontFamily: FONT }}>분석 완료</span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 2.6vw, 34px)', fontWeight: 800, letterSpacing: '-0.035em', color: T.text, margin: 0, lineHeight: 1.2, fontFamily: FONT }}>
            {studentName} 학생의 학생부 종합 분석
          </h1>
        </div>
      </div>

      {/* Main grid: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Col 1: Word cloud */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT }}>핵심 키워드</div>
            <div style={{ fontSize: 14, color: T.textSubtle, fontFamily: FONT }}>3년 빈도순</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <WordCloud words={segibuAnalysis.words} />
          </div>
        </div>

        {/* Col 2: 3 report sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {segibuAnalysis.reportSections.map((s) => {
            const c = T.comp[s.compKey];
            return (
              <div key={s.num} style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '20px 24px', position: 'relative', overflow: 'hidden', flex: 1 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: c.color }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: c.soft, color: c.color, fontSize: 15, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT }}>{s.title}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: c.soft, borderLeft: `4px solid ${c.color}`, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.color, letterSpacing: '0.04em', marginBottom: 6, fontFamily: FONT }}>강점</div>
                  <div style={{ fontSize: 15, color: T.text, lineHeight: 1.7, fontFamily: FONT }}>{s.good}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: T.dangerSoft, borderLeft: `4px solid ${T.danger}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.danger, letterSpacing: '0.04em', marginBottom: 6, fontFamily: FONT }}>보완</div>
                  <div style={{ fontSize: 15, color: T.text, lineHeight: 1.7, fontFamily: FONT }}>{s.fix}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Col 3: Suggestions */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: FONT }}>보완 제안</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {segibuAnalysis.suggestions.map((s, i) => {
              const cc = T.comp[s.c];
              return (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderLeft: `4px solid ${cc.color}`, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6, fontFamily: FONT }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
