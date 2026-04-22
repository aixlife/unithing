'use client';
import { useStudent } from '@/contexts/StudentContext';
import { SegibuAnalysis } from '@/types/analysis';

const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  accent: '#F59E0B', accentSoft: '#FEF3C7',
  danger: '#DC2626', dangerSoft: '#FEE2E2',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  warning: '#D97706', warningSoft: '#FEF3C7',
  comp: {
    academic: { color: '#1B64DA', soft: '#EBF2FF' },
    career:   { color: '#D97706', soft: '#FEF3C7' },
    community:{ color: '#059669', soft: '#D1FAE5' },
  },
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

// 키워드 클라우드: summaryHighlights 텍스트에서 명사 추출 (간단 tokenize)
function extractWords(analysis: SegibuAnalysis): { text: string; size: number }[] {
  const text = [
    analysis.summaryHighlights.academic,
    analysis.summaryHighlights.career,
    analysis.summaryHighlights.community,
  ].join(' ');
  const stopWords = new Set(['및', '을', '를', '이', '가', '은', '는', '에', '의', '로', '에서', '으로', '과', '와', '도', '하는', '있는', '통해', '대한', '위한', '있음', '하여', '등을', '등의', '등이', '하며', '이며', '이고', '하고']);
  const tokens = text.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length >= 2 && !stopWords.has(t));
  const freq: Record<string, number> = {};
  tokens.forEach(t => { freq[t] = (freq[t] ?? 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([text, cnt]) => ({ text, size: Math.min(28, 14 + cnt * 3) }));
}

function WordCloud({ words }: { words: { text: string; size: number }[] }) {
  const colors = [T.primary, T.text, T.textMuted, T.comp.career.color, T.comp.community.color];
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

  const studentName = currentStudent?.name ?? segibuAnalysis.studentName ?? '학생';
  const words = extractWords(segibuAnalysis);

  const reportSections = [
    {
      num: '①', title: '학업 역량', compKey: 'academic' as const,
      good: segibuAnalysis.summaryHighlights.academic,
      fix: segibuAnalysis.futureStrategy.subjects,
    },
    {
      num: '②', title: '진로 역량', compKey: 'career' as const,
      good: segibuAnalysis.summaryHighlights.career,
      fix: segibuAnalysis.futureStrategy.deepDive,
    },
    {
      num: '③', title: '공동체 역량', compKey: 'community' as const,
      good: segibuAnalysis.summaryHighlights.community,
      fix: '협업 활동 및 리더십 경험을 더욱 구체적으로 기술하고 성과를 수치화하세요.',
    },
  ];

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ padding: '3px 10px', fontSize: 14, borderRadius: 5, background: T.bgAlt, color: T.textMuted, fontWeight: 600, fontFamily: FONT }}>학생부 리포트</span>
            <span style={{ padding: '3px 10px', fontSize: 14, borderRadius: 5, background: T.successSoft, color: T.success, fontWeight: 600, fontFamily: FONT }}>분석 완료</span>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.035em', color: T.text, margin: 0, lineHeight: 1.2, fontFamily: FONT }}>
            {studentName} 학생의 학생부 종합 분석
          </h1>
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Col 1: Word cloud */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT }}>핵심 키워드</div>
            <div style={{ fontSize: 12, color: T.textSubtle, fontFamily: FONT }}>역량 요약 기반</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <WordCloud words={words} />
          </div>
        </div>

        {/* Col 2: Report sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reportSections.map((s) => {
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
                  <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7, fontFamily: FONT }}>{s.good}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: T.dangerSoft, borderLeft: `4px solid ${T.danger}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.danger, letterSpacing: '0.04em', marginBottom: 6, fontFamily: FONT }}>보완</div>
                  <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7, fontFamily: FONT }}>{s.fix}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Col 3: Score overview */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', marginBottom: 4, fontFamily: FONT }}>역량 점수</div>
          {(['academic', 'career', 'community'] as const).map((key) => {
            const labels = { academic: '학업', career: '진로', community: '공동체' };
            const c = T.comp[key];
            const score = segibuAnalysis.scores[key];
            return (
              <div key={key} style={{ padding: '14px 16px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderLeft: `4px solid ${c.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT }}>{labels[key]} 역량</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.color, fontFamily: FONT }}>{score}점</div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.border }}>
                  <div style={{ height: '100%', borderRadius: 3, background: c.color, width: `${score}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 'auto', padding: '12px 14px', borderRadius: 10, background: T.primarySoft, border: `1px solid ${T.primaryBorder}` }}>
            <div style={{ fontSize: 12, color: T.primary, fontWeight: 700, marginBottom: 4, fontFamily: FONT }}>종합 평균</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.primary, fontFamily: FONT }}>
              {Math.round((segibuAnalysis.scores.academic + segibuAnalysis.scores.career + segibuAnalysis.scores.community) / 3)}점
            </div>
            <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 2, fontFamily: FONT }}>전국 평균 기준 70점</div>
          </div>
        </div>

      </div>
    </div>
  );
}
