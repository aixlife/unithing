'use client';
import { useState, useRef } from 'react';
import { SegibuAnalysis } from '@/types/analysis';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  danger: '#DC2626', dangerSoft: '#FEE2E2',
  warning: '#D97706', warningSoft: '#FEF3C7',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  shadow: '0 8px 24px rgba(0,0,0,0.06)',
  comp: {
    academic:  { color: '#1B64DA', soft: '#EBF2FF', label: '학업역량' },
    career:    { color: '#D97706', soft: '#FEF3C7', label: '진로역량' },
    community: { color: '#059669', soft: '#D1FAE5', label: '공동체역량' },
  },
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

const SERVICE_LABELS: Record<NonNullable<SegibuAnalysis['admissionsReadiness']>['nextActions'][number]['linkedService'], string> = {
  university: '대학 찾기',
  subject: '과목 설계',
  seteuk: '세특 설계',
  report: '상담 리포트',
};

const COMP_LABELS: Record<keyof SegibuAnalysis['scores'], string> = {
  academic: '학업역량',
  career: '진로역량',
  community: '공동체역량',
};

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join('\n');
  if (typeof value === 'object') return Object.values(value).map(toText).filter(Boolean).join('\n');
  return String(value);
}

function collectRecordTexts(record: Record<string, { y1: string; y2: string; y3: string }>): string[] {
  return Object.values(record).flatMap(item => [item.y1, item.y2, item.y3]);
}

// ── 키워드 추출 ───────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  '및', '을', '를', '이', '가', '은', '는', '에', '의', '로', '에서', '으로', '과', '와', '도',
  '하는', '있는', '통해', '대한', '위한', '있음', '하여', '등을', '등의', '등이', '하며', '이며', '이고', '하고',
  '위해', '그리고', '또한', '특히', '이를', '하였으며', '하였다', '지속적으로', '바탕으로', '통하여',
  '활동을', '활동의', '활동에', '활동이', '모습을', '모습이', '보였다', '보임', '나타냄', '발휘하며', '보여주었다', '보여줌', '기울여', '기반으로',
  '설명함', '있음을', '발표함', '등과', '함으로써', '하였고', '하였음', '되었다', '되었으며', '있었다', '있었으며',
  '나타났다', '이루어', '이루며', '보여', '보이며', '않고', '않으며', '않았다', '없이', '없는', '갖고', '가지며',
  '이후', '이전', '통한', '관련', '부분', '과정', '결과', '내용', '방법', '방식', '수준', '측면',
  '학생', '활동', '수업', '시간', '중에', '에게', '으로써', '에도', '에서도', '에게도',
  '하기', '하기도', '하기위해', '하기도', '하여서', '함께', '자신', '본인', '이러한', '그러한',
  '다양한', '중요한', '필요한', '적극적', '적극적으로', '능동적', '능동적으로',
]);

function extractKeywords(texts: string[]): { text: string; size: number }[] {
  const combined = texts.join(' ');
  const tokens = combined.replace(/[^가-힣a-zA-Z\s]/g, ' ').split(/\s+/).filter(t => t.length >= 2 && !STOPWORDS.has(t));
  const freq: Record<string, number> = {};
  tokens.forEach(t => { freq[t] = (freq[t] ?? 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([text, cnt]) => ({ text, size: Math.min(26, 12 + cnt * 2.5) }));
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────
function KeywordCloud({ words }: { words: { text: string; size: number }[] }) {
  const palette = [T.primary, T.comp.career.color, T.comp.community.color, T.text, T.textMuted];
  if (words.length === 0) return <p style={{ fontSize: 13, color: T.textSubtle, fontFamily: FONT }}>키워드를 추출할 수 없습니다.</p>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center', justifyContent: 'center', padding: '8px 4px' }}>
      {words.map((w, i) => (
        <span key={i} style={{ fontSize: w.size, fontWeight: w.size > 18 ? 800 : 600, color: palette[i % palette.length], letterSpacing: '-0.03em', lineHeight: 1.2, opacity: w.size > 18 ? 1 : 0.75, fontFamily: FONT }}>{w.text}</span>
      ))}
    </div>
  );
}

function ScoreBar({ label, score, color, soft }: { label: string; score: number; color: string; soft: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, fontFamily: FONT }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: FONT }}>{score}점</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: soft }}>
        <div style={{ height: '100%', borderRadius: 4, background: color, width: `${score}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function CompRadar({ scores }: { scores: SegibuAnalysis['scores'] }) {
  const data = [
    { subject: '학업역량', value: scores.academic, fullMark: 100 },
    { subject: '진로역량', value: scores.career,   fullMark: 100 },
    { subject: '공동체역량', value: scores.community, fullMark: 100 },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
        <PolarGrid stroke={T.border} />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: T.textMuted, fontFamily: FONT }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="value" stroke={T.primary} fill={T.primary} fillOpacity={0.18} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function HighlightPill({ label, text, color, soft }: { label: string; text: string; color: string; soft: string }) {
  if (!text) return null;
  return (
    <div style={{ padding: '8px 12px', borderRadius: 8, background: soft, borderLeft: `3px solid ${color}`, marginBottom: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.04em', display: 'block', marginBottom: 2, fontFamily: FONT }}>{label}</span>
      <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, margin: 0, fontFamily: FONT }}>{text}</p>
    </div>
  );
}

function ReadinessCard({ readiness }: { readiness: NonNullable<SegibuAnalysis['admissionsReadiness']> }) {
  const confidenceLabel = readiness.reliability.confidence === 'high' ? '높음' : readiness.reliability.confidence === 'low' ? '낮음' : '보통';

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px', gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6, fontFamily: FONT }}>상담 처방 요약</div>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: 0, fontFamily: FONT }}>{readiness.overall}</p>
        </div>
        <span style={{ flexShrink: 0, padding: '4px 9px', borderRadius: 999, background: T.bgAlt, color: T.textMuted, fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
          신뢰도 {confidenceLabel}
        </span>
      </div>

      {readiness.criticalWeaknesses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 14 }}>
          {readiness.criticalWeaknesses.slice(0, 3).map((item, index) => {
            const comp = T.comp[item.competency];
            return (
              <div key={`${item.competency}-${index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', background: T.surfaceAlt, borderTop: `3px solid ${comp.color}` }}>
                <div style={{ fontSize: 11, color: comp.color, fontWeight: 800, letterSpacing: '0.04em', marginBottom: 5, fontFamily: FONT }}>{COMP_LABELS[item.competency]} 보완</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.45, marginBottom: 6, fontFamily: FONT }}>{item.issue}</div>
                <p style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.6, margin: '0 0 6px', fontFamily: FONT }}>{item.evidence}</p>
                <p style={{ fontSize: 12.5, color: T.text, lineHeight: 1.6, margin: 0, fontFamily: FONT }}>{item.recommendation}</p>
              </div>
            );
          })}
        </div>
      )}

      {readiness.nextActions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {readiness.nextActions.slice(0, 4).map(action => (
            <div key={`${action.priority}-${action.action}`} style={{ display: 'grid', gridTemplateColumns: '32px 94px 1fr', gap: 10, alignItems: 'start', padding: '10px 12px', borderRadius: 10, background: T.bgAlt }}>
              <div style={{ width: 24, height: 24, borderRadius: 999, background: T.primary, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>{action.priority}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, fontFamily: FONT }}>{SERVICE_LABELS[action.linkedService]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.5, fontFamily: FONT }}>{action.action}</div>
                <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.55, fontFamily: FONT }}>{action.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(readiness.reliability.missingData.length > 0 || readiness.reliability.notes) && (
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textSubtle, marginBottom: 4, fontFamily: FONT }}>분석 신뢰도 메모</div>
          {readiness.reliability.missingData.length > 0 && (
            <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>누락 가능 데이터: {readiness.reliability.missingData.join(', ')}</div>
          )}
          {readiness.reliability.notes && (
            <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>{readiness.reliability.notes}</div>
          )}
        </div>
      )}
    </div>
  );
}

function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '학생';
}

function buildMarkdownReport(r: SegibuAnalysis, studentName: string, keywords: { text: string; size: number }[]): string {
  const readiness = r.admissionsReadiness;
  const lines = [
    `# ${studentName} 학생부 리포트`,
    '',
    `- 학교: ${r.school || '-'}`,
    `- 학년: ${r.grade || '-'}`,
    `- 목표 학과: ${r.targetDept || '-'}`,
    `- 학업역량: ${r.scores.academic}점`,
    `- 진로역량: ${r.scores.career}점`,
    `- 공동체역량: ${r.scores.community}점`,
    '',
    '## 핵심 요약',
    '',
    `### 학업역량`,
    r.summaryHighlights.academic || '-',
    '',
    `### 진로역량`,
    r.summaryHighlights.career || '-',
    '',
    `### 공동체역량`,
    r.summaryHighlights.community || '-',
    '',
    '## 핵심 키워드',
    '',
    keywords.map(k => k.text).join(', ') || '-',
    '',
    '## 향후 전략',
    '',
    `### 심화 탐구 제안`,
    toText(r.futureStrategy.deepDive) || '-',
    '',
    `### 연계 추천 과목`,
    toText(r.futureStrategy.subjects) || '-',
  ];

  if (readiness) {
    lines.push(
      '',
      '## 상담 처방',
      '',
      readiness.overall || '-',
      '',
      '### 주요 보완점',
      '',
      ...readiness.criticalWeaknesses.flatMap(item => [
        `- ${COMP_LABELS[item.competency]}: ${item.issue}`,
        `  - 근거: ${item.evidence}`,
        `  - 처방: ${item.recommendation}`,
      ]),
      '',
      '### 다음 액션',
      '',
      ...readiness.nextActions.map(action => `- ${action.priority}. [${SERVICE_LABELS[action.linkedService]}] ${action.action}: ${action.reason}`),
      '',
      '### 분석 신뢰도',
      '',
      `- confidence: ${readiness.reliability.confidence}`,
      `- missingData: ${readiness.reliability.missingData.join(', ') || '-'}`,
      `- notes: ${readiness.reliability.notes || '-'}`,
    );
  }

  lines.push('', '## 심층 분석 리포트', '', r.report || '-');
  return lines.join('\n');
}

// 연도 탭 + 텍스트 + 하이라이트 뷰
function YearTabView({
  raw,
  hl,
}: {
  raw: { y1: string; y2: string; y3: string };
  hl: { y1: { academic: string; career: string; community: string }; y2: { academic: string; career: string; community: string }; y3: { academic: string; career: string; community: string } };
}) {
  const [year, setYear] = useState<'y1' | 'y2' | 'y3'>('y1');
  const yearLabel = { y1: '1학년', y2: '2학년', y3: '3학년' };
  const text = raw[year];
  const h = hl[year];
  const hasContent = text?.trim();

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['y1', 'y2', 'y3'] as const).map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT,
            background: year === y ? T.primary : T.bg,
            color: year === y ? '#fff' : T.textMuted,
          }}>{yearLabel[y]}</button>
        ))}
      </div>

      {!hasContent ? (
        <p style={{ fontSize: 13, color: T.textSubtle, fontStyle: 'italic', fontFamily: FONT }}>해당 학년 내용 없음</p>
      ) : (
        <>
          <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.75, margin: 0, fontFamily: FONT, whiteSpace: 'pre-line' }}>{text}</p>
          </div>
          {(h.academic || h.career || h.community) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textSubtle, letterSpacing: '0.06em', margin: '0 0 6px', fontFamily: FONT }}>역량 하이라이트</p>
              <HighlightPill label="학업역량" text={h.academic} color={T.comp.academic.color} soft={T.comp.academic.soft} />
              <HighlightPill label="진로역량" text={h.career}   color={T.comp.career.color}   soft={T.comp.career.soft} />
              <HighlightPill label="공동체역량" text={h.community} color={T.comp.community.color} soft={T.comp.community.soft} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── 탭 정의 ──────────────────────────────────────────────────────────────────
type MainTab = 'overview' | 'changche' | 'curriculum' | 'behavior' | 'critical';
type ChangcheTab = 'individual' | 'club' | 'career_act';
type CurriculumTab = 'korean' | 'math' | 'english' | 'social' | 'science' | 'liberal' | 'arts_phys';

const CHANGCHE_TABS: { key: ChangcheTab; label: string }[] = [
  { key: 'individual', label: '자율활동' },
  { key: 'club',       label: '동아리활동' },
  { key: 'career_act', label: '진로활동' },
];

const CURRICULUM_TABS: { key: CurriculumTab; label: string }[] = [
  { key: 'korean',    label: '국어' },
  { key: 'math',      label: '수학' },
  { key: 'english',   label: '영어' },
  { key: 'social',    label: '사회' },
  { key: 'science',   label: '과학' },
  { key: 'liberal',   label: '정보·교양' },
  { key: 'arts_phys', label: '예체능' },
];

// ── 재사용 가능한 학생부 리포트 뷰 ───────────────────────────────────────────
export function StudentReportView({
  segibuAnalysis,
  studentName,
  embedded = false,
}: {
  segibuAnalysis: SegibuAnalysis | null;
  studentName?: string;
  embedded?: boolean;
}) {
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [changcheTab, setChangcheTab] = useState<ChangcheTab>('individual');
  const [curriculumTab, setCurriculumTab] = useState<CurriculumTab>('korean');
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!segibuAnalysis) {
    return (
      <div style={{ fontFamily: FONT, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>먼저 생기부 분석이 필요해요</div>
        <div style={{ fontSize: 15, color: T.textMuted }}>
          <strong>생기부 분석</strong> 탭에서 PDF를 업로드하고 분석을 완료하면<br />학생부 리포트가 자동으로 생성됩니다.
        </div>
      </div>
    );
  }

  const r = segibuAnalysis;
  const readiness = r.admissionsReadiness;
  const resolvedStudentName = studentName ?? r.studentName ?? '학생';
  const avg3 = Math.round((r.scores.academic + r.scores.career + r.scores.community) / 3);

  // 키워드: structuredData 전체 텍스트에서 추출
  const allTexts = [
    ...collectRecordTexts(r.structuredData.changche),
    ...collectRecordTexts(r.structuredData.curriculum),
    r.structuredData.behavior.y1, r.structuredData.behavior.y2, r.structuredData.behavior.y3,
    r.summaryHighlights.academic, r.summaryHighlights.career, r.summaryHighlights.community,
    toText(r.futureStrategy.deepDive), toText(r.futureStrategy.subjects),
    readiness?.overall,
    ...(readiness?.criticalWeaknesses.flatMap(item => [item.issue, item.evidence, item.recommendation]) ?? []),
  ].filter((text): text is string => Boolean(text));
  const keywords = extractKeywords(allTexts);

  // PDF 다운로드
  async function handlePdf() {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' });
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let y = 0;
      const pageH = 297;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, -y, imgW, imgH);
        y += pageH;
      }
      pdf.save(`${resolvedStudentName}_학생부리포트.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  function handleMarkdown() {
    const markdown = buildMarkdownReport(r, resolvedStudentName, keywords);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFilename(resolvedStudentName)}_학생부리포트.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabStyle = (active: boolean) => ({
    padding: '6px 14px', fontSize: 13, fontWeight: active ? 700 : 500, borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT,
    background: active ? T.primary : 'transparent',
    color: active ? '#fff' : T.textMuted,
    transition: 'all 0.15s',
  });
  const subTabStyle = (active: boolean) => ({
    padding: '4px 12px', fontSize: 12, fontWeight: active ? 700 : 500, borderRadius: 16, border: `1px solid ${active ? T.primary : T.border}`, cursor: 'pointer', fontFamily: FONT,
    background: active ? T.primarySoft : T.surface,
    color: active ? T.primary : T.textMuted,
  });

  return (
    <div ref={reportRef} style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16, background: embedded ? 'transparent' : T.bg }}>

      {/* ── 헤더 ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: embedded ? '16px 18px' : '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ padding: '2px 9px', fontSize: 12, borderRadius: 4, background: T.primarySoft, color: T.primary, fontWeight: 700, fontFamily: FONT }}>학생부 종합 리포트</span>
            {r.targetDept && <span style={{ padding: '2px 9px', fontSize: 12, borderRadius: 4, background: T.bg, color: T.textMuted, fontWeight: 600, fontFamily: FONT }}>목표: {r.targetDept}</span>}
          </div>
          <div style={{ fontSize: embedded ? 18 : 'clamp(18px, 2vw, 24px)', fontWeight: 800, color: T.text, letterSpacing: '-0.03em', fontFamily: FONT }}>
            {embedded ? '분석 결과를 읽기 쉬운 상담 리포트로 정리했습니다.' : `${resolvedStudentName} 학생 학생부 리포트`}
          </div>
          {!embedded && r.school && <div style={{ fontSize: 13, color: T.textSubtle, marginTop: 3, fontFamily: FONT }}>{r.school}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={handleMarkdown} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer',
            background: T.surface, color: T.textMuted, fontSize: 13, fontWeight: 700, fontFamily: FONT,
          }}>
            Markdown 저장
          </button>
          <button onClick={handlePdf} disabled={downloading} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
            background: T.primary, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: FONT, opacity: downloading ? 0.7 : 1,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 16L6 10h4V3h4v7h4l-6 6z" fill="white"/><path d="M5 20h14" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            {downloading ? '생성 중...' : 'PDF 저장'}
          </button>
        </div>
      </div>

      {/* ── 메인 탭 ── */}
      <div style={{ display: 'flex', gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '6px 8px', flexWrap: 'wrap' }}>
        {([['overview', '종합 현황'], ['changche', '창의적 체험활동'], ['curriculum', '교과 세부능력'], ['behavior', '행동 특성'], ['critical', '비판적 분석']] as const).map(([k, l]) => (
          <button key={k} style={tabStyle(mainTab === k)} onClick={() => setMainTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── 종합 현황 ── */}
      {mainTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {/* 역량 레이더 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 12, fontFamily: FONT }}>3대 역량 레이더</div>
            <CompRadar scores={r.scores} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
              {(['academic', 'career', 'community'] as const).map(k => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.comp[k].color }} />
                  <span style={{ fontSize: 11, color: T.textSubtle, fontFamily: FONT }}>{T.comp[k].label} {r.scores[k]}점</span>
                </div>
              ))}
            </div>
          </div>

          {/* 역량 점수 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: FONT }}>역량 점수</div>
              <div style={{ fontSize: 11, color: T.textSubtle, fontFamily: FONT }}>전국 평균 기준 70점</div>
            </div>
            <ScoreBar label="학업 역량" score={r.scores.academic}  color={T.comp.academic.color}  soft={T.comp.academic.soft} />
            <ScoreBar label="진로 역량" score={r.scores.career}    color={T.comp.career.color}    soft={T.comp.career.soft} />
            <ScoreBar label="공동체 역량" score={r.scores.community} color={T.comp.community.color} soft={T.comp.community.soft} />
            <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: T.primarySoft, border: `1px solid ${T.primaryBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.primary, fontFamily: FONT }}>종합 평균</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: T.primary, fontFamily: FONT }}>{avg3}점</span>
            </div>
          </div>

          {/* 핵심 키워드 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: FONT }}>핵심 키워드</div>
              <div style={{ fontSize: 11, color: T.textSubtle, fontFamily: FONT }}>전체 기록 기반 · 글자 크기 = 빈도</div>
            </div>
            <KeywordCloud words={keywords} />
          </div>

          {readiness && <ReadinessCard readiness={readiness} />}

          {/* 역량 요약 */}
          {(['academic', 'career', 'community'] as const).map(k => (
            <div key={k} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px', borderTop: `4px solid ${T.comp[k].color}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.comp[k].color, marginBottom: 8, fontFamily: FONT }}>{T.comp[k].label}</div>
              <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: 0, fontFamily: FONT }}>{r.summaryHighlights[k]}</p>
            </div>
          ))}

          {/* 향후 전략 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14, fontFamily: FONT }}>향후 전략 제언</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: T.primarySoft, border: `1px solid ${T.primaryBorder}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, letterSpacing: '0.04em', marginBottom: 6, fontFamily: FONT }}>심화 탐구 제안</div>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: 0, fontFamily: FONT, whiteSpace: 'pre-line' }}>{toText(r.futureStrategy.deepDive)}</p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: T.warningSoft, border: `1px solid #FCD89A` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.warning, letterSpacing: '0.04em', marginBottom: 6, fontFamily: FONT }}>연계 추천 과목</div>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: 0, fontFamily: FONT, whiteSpace: 'pre-line' }}>{toText(r.futureStrategy.subjects)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 창의적 체험활동 ── */}
      {mainTab === 'changche' && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {CHANGCHE_TABS.map(({ key, label }) => (
              <button key={key} style={subTabStyle(changcheTab === key)} onClick={() => setChangcheTab(key)}>{label}</button>
            ))}
          </div>
          <YearTabView
            raw={r.structuredData.changche[changcheTab]}
            hl={r.highlights.changche[changcheTab]}
          />
        </div>
      )}

      {/* ── 교과 세부능력 ── */}
      {mainTab === 'curriculum' && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {CURRICULUM_TABS.map(({ key, label }) => (
              <button key={key} style={subTabStyle(curriculumTab === key)} onClick={() => setCurriculumTab(key)}>{label}</button>
            ))}
          </div>
          <YearTabView
            raw={r.structuredData.curriculum[curriculumTab]}
            hl={r.highlights.curriculum[curriculumTab]}
          />
        </div>
      )}

      {/* ── 행동 특성 ── */}
      {mainTab === 'behavior' && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 16, fontFamily: FONT }}>행동 특성 및 종합 의견</div>
          <YearTabView
            raw={r.structuredData.behavior}
            hl={r.highlights.behavior}
          />
        </div>
      )}

      {/* ── 비판적 분석 ── */}
      {mainTab === 'critical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FFF7ED', border: `1px solid #FED7AA`, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#D97706" strokeWidth="2" fill="none"/><line x1="12" y1="9" x2="12" y2="13" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, fontFamily: FONT }}>
              <strong>비판적 관점 분석</strong>이란? 입학사정관의 시각에서 학생부의 강점과 약점을 객관적·비판적으로 평가한 심층 리포트입니다. 단순 칭찬이 아닌 실질적 보완점을 포함합니다.
            </div>
          </div>

          {/* 역량 점수 요약 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {(['academic', 'career', 'community'] as const).map(k => {
              const score = r.scores[k];
              const { color, soft, label } = T.comp[k];
              const tier = score >= 85 ? '최상' : score >= 75 ? '상' : score >= 65 ? '중상' : score >= 55 ? '중' : '보완필요';
              return (
                <div key={k} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', borderTop: `3px solid ${color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4, fontFamily: FONT }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: FONT }}>{score}</span>
                    <span style={{ fontSize: 11, color: T.textSubtle, fontFamily: FONT }}>/100</span>
                    <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: soft, color, fontFamily: FONT }}>{tier}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full markdown report */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px 28px' }}>
            <div className="segibu-report" style={{ fontSize: 15, lineHeight: 1.8, color: T.text, fontFamily: FONT }}>
              <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{r.report}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
