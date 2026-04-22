'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { SegibuAnalysis, GradeMatrix, CategoryGrades } from '@/types/analysis';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ── 토큰 ──────────────────────────────────────────────────────────────────────
const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  danger: '#DC2626', dangerSoft: '#FEE2E2',
  warning: '#D97706', warningSoft: '#FEF3C7',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  shadow: '0 8px 24px rgba(0,0,0,0.06)',
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

const COMP_COLOR = {
  academic: '#1B64DA',
  career: '#D97706',
  community: '#059669',
} as const;

// ── 분석 단계 라벨 ────────────────────────────────────────────────────────────
const STAGES = [
  { until: 25, label: 'PDF 파일을 읽는 중...' },
  { until: 55, label: 'AI가 생기부 내용을 파악하는 중...' },
  { until: 78, label: '역량 점수 및 성적 분석 중...' },
  { until: 92, label: '심층 리포트 생성 중...' },
  { until: 100, label: '거의 다 됐어요!' },
];

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function fmtGrade(v: number | null) {
  return v == null ? '-' : v.toFixed(2);
}

function ScoreBadge({ score, label, color }: { score: number; label: string; color: string }) {
  const tier = score >= 85 ? '최상' : score >= 75 ? '상' : score >= 65 ? '중상' : score >= 55 ? '중' : '하';
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 13, color: T.textSubtle }}>/100</span>
        <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: color + '1A', color }}>{tier}</span>
      </div>
      <div style={{ height: 5, background: T.bgAlt, borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.8s ease-out' }} />
      </div>
    </div>
  );
}

// ── 성적 매트릭스 ─────────────────────────────────────────────────────────────
const GRADE_LABELS: { key: keyof GradeMatrix; label: string }[] = [
  { key: 'korean', label: '국어' },
  { key: 'math', label: '수학' },
  { key: 'english', label: '영어' },
  { key: 'social', label: '사회' },
  { key: 'science', label: '과학' },
  { key: 'others', label: '기타' },
  { key: 'total', label: '전체' },
];

const SEM_LABELS = ['1-1', '1-2', '2-1', '2-2', '3-1'];
const SEM_KEYS: (keyof CategoryGrades)[] = ['s1_1', 's1_2', 's2_1', 's2_2', 's3_1'];

function GradeTable({ grades }: { grades: GradeMatrix }) {
  const cellStyle = (v: number | null, isTotal?: boolean): React.CSSProperties => ({
    padding: '9px 10px',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: isTotal ? 700 : v != null && v <= 2 ? 700 : 400,
    color: v == null ? T.textSubtle : v <= 2 ? T.primary : v >= 5 ? T.danger : T.text,
    background: isTotal ? T.bgAlt : T.surface,
    borderBottom: `1px solid ${T.border}`,
    fontFamily: FONT,
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${T.border}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
        <thead>
          <tr style={{ background: T.surfaceAlt }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: T.textMuted, borderBottom: `1px solid ${T.border}`, fontFamily: FONT }}>교과</th>
            {SEM_LABELS.map(l => (
              <th key={l} style={{ padding: '10px 10px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.textMuted, borderBottom: `1px solid ${T.border}`, fontFamily: FONT }}>{l}학기</th>
            ))}
            <th style={{ padding: '10px 10px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.primary, borderBottom: `1px solid ${T.border}`, fontFamily: FONT }}>평균</th>
          </tr>
        </thead>
        <tbody>
          {GRADE_LABELS.map(({ key, label }) => {
            const row = grades[key];
            const isTotal = key === 'total';
            return (
              <tr key={key} style={{ background: isTotal ? T.bgAlt : T.surface }}>
                <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: isTotal ? 700 : 600, color: T.text, borderBottom: `1px solid ${T.border}`, fontFamily: FONT }}>{label}</td>
                {SEM_KEYS.map(sk => <td key={sk} style={cellStyle(row[sk], isTotal)}>{fmtGrade(row[sk])}</td>)}
                <td style={{ ...cellStyle(row.avg, isTotal), fontWeight: 700, color: isTotal ? T.primary : (row.avg != null && row.avg <= 2 ? T.primary : T.text) }}>{fmtGrade(row.avg)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── 성적 추이 꺾은선 ──────────────────────────────────────────────────────────
function GradeLineChart({ grades }: { grades: GradeMatrix }) {
  const sems = ['1-1', '1-2', '2-1', '2-2', '3-1'];
  const semKeys: (keyof CategoryGrades)[] = ['s1_1', 's1_2', 's2_1', 's2_2', 's3_1'];
  const data = sems.map((sem, i) => ({
    sem,
    국어: grades.korean[semKeys[i]],
    수학: grades.math[semKeys[i]],
    영어: grades.english[semKeys[i]],
    사회: grades.social[semKeys[i]],
    과학: grades.science[semKeys[i]],
    전체: grades.total[semKeys[i]],
  }));

  const colors = ['#1B64DA', '#D97706', '#059669', '#7C3AED', '#DC2626', '#374151'];
  const keys = ['국어', '수학', '영어', '사회', '과학', '전체'];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
        <XAxis dataKey="sem" tick={{ fontSize: 12, fill: T.textMuted, fontFamily: FONT }} />
        <YAxis reversed domain={[1, 9]} ticks={[1,2,3,4,5,6,7,8,9]} tick={{ fontSize: 11, fill: T.textMuted }} />
        <Tooltip
          formatter={(v) => (v != null && typeof v === 'number') ? `${v.toFixed(2)}등급` : '-'}
          contentStyle={{ fontFamily: FONT, fontSize: 13, borderRadius: 8, border: `1px solid ${T.border}` }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
        {keys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} stroke={colors[i]}
            strokeWidth={k === '전체' ? 2.5 : 1.5}
            strokeDasharray={k === '전체' ? '6 3' : undefined}
            dot={{ r: 3 }} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 역량 레이더 ───────────────────────────────────────────────────────────────
function CompRadar({ scores }: { scores: SegibuAnalysis['scores'] }) {
  const data = [
    { subject: '학업역량', value: scores.academic, fullMark: 100 },
    { subject: '진로역량', value: scores.career, fullMark: 100 },
    { subject: '공동체역량', value: scores.community, fullMark: 100 },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke={T.border} />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: T.text, fontFamily: FONT, fontWeight: 600 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="value" stroke={T.primary} fill={T.primary} fillOpacity={0.18} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── 팝업 ──────────────────────────────────────────────────────────────────────
function Popup({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: T.surface, borderRadius: 16, padding: 28, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, fontFamily: FONT }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T.textSubtle, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const GUIDE_CONTENT = `**분석 가이드**

본 리포트는 입학사정관의 시각에서 생활기록부를 비판적으로 분석한 결과입니다.

**역량 점수 기준**
- 90점↑: 전국 최상위권 수준
- 80~89점: 상위권 (상위 10~20%)
- 70~79점: 중상위권 (상위 20~40%)
- 60~69점: 중위권 (상위 40~60%)
- 60점↓: 보완 필요

**성적 등급 해석**
- 1~2등급: 최상위 (파란색)
- 3~4등급: 상위권
- 5등급↑: 보완 필요 (빨간색)

**활용 방법**
1. 심층 분석 리포트: 학업/진로/공동체 역량별 강점과 보완점 파악
2. 성적 추이 그래프: 학기별 성적 변화 패턴 분석
3. 활동 상세 보기: 창체·교과별 역량 근거 확인
4. 향후 전략: 추천 심화 주제와 연계 과목 참고`;

const CRITERIA_CONTENT = `**평가 기준 (입학사정관 관점)**

**자기주도적 탐구 과정**
학생 스스로 호기심을 가지고 질문을 던지며 주제를 선정하여 탐구한 과정이 드러나는가?

**학업 역량 및 주도성**
성적뿐만 아니라 특정 분야에 대한 심화 탐구, 자발적 연구, 문제 해결 사례가 있는가?

**기록의 구체성 및 차별성**
독창적인 사례와 구체적인 성취가 기술되어 있는가?

**성장 및 변화 과정**
활동의 목적, 배운 점, 진로와의 연계성, 시간이 흐름에 따른 성장이 보이는가?

**협업 및 사회적 책임**
팀 프로젝트나 봉사 활동에서 협업 능력과 기여도가 구체적으로 드러나는가?

**진로 일관성**
활동이 진로와 밀접하게 연결되어 있으며, 진로 변경 시 논리적인 설명이 있는가?

**창의성 및 문제 해결**
스스로 문제를 발견하고 창의적으로 해결한 경험이 있는가?`;

// ── 활동 상세 탭 ──────────────────────────────────────────────────────────────
const ACTIVITY_TABS = [
  { key: 'individual', label: '자율활동' },
  { key: 'club', label: '동아리' },
  { key: 'career_act', label: '진로활동' },
] as const;

const CURRICULUM_TABS = [
  { key: 'korean', label: '국어' },
  { key: 'math', label: '수학' },
  { key: 'english', label: '영어' },
  { key: 'social', label: '사회' },
  { key: 'science', label: '과학' },
  { key: 'liberal', label: '교양' },
  { key: 'arts_phys', label: '예체능' },
] as const;

function HighlightCard({ highlight }: { highlight: { academic: string; career: string; community: string } }) {
  const items = [
    { key: 'academic', label: '학업역량', color: COMP_COLOR.academic },
    { key: 'career', label: '진로역량', color: COMP_COLOR.career },
    { key: 'community', label: '공동체역량', color: COMP_COLOR.community },
  ] as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(({ key, label, color }) => highlight[key] && highlight[key] !== '관련 내용 없음' && (
        <div key={key} style={{ padding: '10px 14px', borderRadius: 8, background: T.bgAlt, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4, letterSpacing: '0.04em' }}>{label}</div>
          <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>{highlight[key]}</div>
        </div>
      ))}
    </div>
  );
}

// ── 프로그레스 바 포함 로딩 화면 ─────────────────────────────────────────────
function LoadingScreen({ fileName }: { fileName?: string }) {
  const [progress, setProgress] = useState(0);
  const stage = STAGES.find(s => progress < s.until)?.label ?? '거의 다 됐어요!';

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 99) return p;
        const step = p < 92
          ? Math.max(0.2, (92 - p) * 0.025) + Math.random() * 0.4
          : 0.04 + Math.random() * 0.03;
        return Math.min(99, p + step);
      });
    }, 350);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ fontFamily: FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '52px 40px', maxWidth: 560, margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <circle cx="26" cy="26" r="22" stroke={T.border} strokeWidth="4"/>
        <path d="M26 4a22 22 0 0 1 22 22" stroke={T.primary} strokeWidth="4" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 26 26" to="360 26 26" dur="0.75s" repeatCount="indefinite"/>
        </path>
      </svg>
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', marginBottom: 6 }}>AI가 생기부를 분석하고 있어요</div>
        {fileName && <div style={{ fontSize: 14, color: T.textMuted }}>{fileName}</div>}
      </div>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, color: T.textMuted }}>{stage}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.primary, letterSpacing: '-0.02em' }}>{Math.round(progress)}%</div>
        </div>
        <div style={{ width: '100%', height: 8, background: T.bgAlt, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${T.primary}, #5B9BFF)`, borderRadius: 8, transition: 'width 0.35s ease-out' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {STAGES.slice(0, -1).map((s, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: progress >= s.until ? T.primary : T.border, transition: 'background 0.3s', flexShrink: 0 }} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 14, color: T.textSubtle }}>보통 30~90초 정도 걸려요</div>
    </div>
  );
}

// ── 업로드 화면 ───────────────────────────────────────────────────────────────
function UploadScreen({ currentStudentName, onAnalyze, error }: {
  currentStudentName?: string;
  onAnalyze: (file: File) => void;
  error: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div style={{ fontFamily: FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, maxWidth: 560, margin: '40px auto' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4 }}>생기부 AI 심층 분석</div>
      <div style={{ fontSize: 15, color: T.textMuted, marginBottom: 20 }}>
        {currentStudentName ? `${currentStudentName} 학생의 ` : ''}생기부 PDF를 업로드하면 역량·성적·활동을 종합 분석해드려요.
      </div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setFile(f); }}
        style={{ border: `2px dashed ${drag ? T.primary : T.borderStrong}`, borderRadius: 12, padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: drag ? T.primarySoft : T.bgAlt, transition: 'all 0.15s' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={T.textSubtle} strokeWidth="1.8" fill="none"/>
          <polyline points="14 2 14 8 20 8" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="12" y1="18" x2="12" y2="12" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="9 15 12 12 15 15" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.textMuted }}>{file ? file.name : '생기부 PDF를 끌어다 놓거나 클릭해 선택'}</div>
        <div style={{ fontSize: 13, color: T.textSubtle }}>최대 20MB · PDF만 가능</div>
      </div>
      <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
      {error && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: T.dangerSoft, color: T.danger, fontSize: 14 }}>{error}</div>}
      <button
        onClick={() => file && onAnalyze(file)}
        disabled={!file}
        style={{ marginTop: 14, width: '100%', height: 48, borderRadius: 10, background: file ? T.primary : T.bgAlt, color: file ? '#fff' : T.textSubtle, border: 'none', fontSize: 16, fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed', fontFamily: FONT }}
      >
        AI 심층 분석 시작
      </button>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function Service3Segibu() {
  const { segibuAnalysis, analyzeSegibu, analysisLoading, analysisError, currentStudent } = useStudent();
  const [tab, setTab] = useState<'report' | 'grades' | 'activities'>('report');
  const [activityCategory, setActivityCategory] = useState<'individual' | 'club' | 'career_act'>('individual');
  const [curriculumKey, setCurriculumKey] = useState<'korean' | 'math' | 'english' | 'social' | 'science' | 'liberal' | 'arts_phys'>('korean');
  const [yearTab, setYearTab] = useState<'y1' | 'y2' | 'y3'>('y1');
  const [showGuide, setShowGuide] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const handleAnalyze = useCallback((file: File) => {
    setLastFile(file);
    analyzeSegibu(file);
  }, [analyzeSegibu]);

  const handleReanalyze = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf';
    input.onchange = e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleAnalyze(f); };
    input.click();
  };

  const handlePDF = async () => {
    if (!reportRef.current) return;
    setIsPrinting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      let y = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      while (y < h) {
        if (y > 0) pdf.addPage();
        pdf.addImage(img, 'PNG', 0, -y, w, h);
        y += pageH;
      }
      const name = segibuAnalysis?.studentName ?? '학생';
      pdf.save(`${name}_생기부분석리포트.pdf`);
    } finally {
      setIsPrinting(false);
    }
  };

  if (analysisLoading) return <LoadingScreen fileName={lastFile?.name} />;
  if (!segibuAnalysis) return <UploadScreen currentStudentName={currentStudent?.name} onAnalyze={handleAnalyze} error={analysisError} />;

  const r = segibuAnalysis;
  const avgAll = r.groupAverages.all;

  return (
    <div ref={reportRef} style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: 800, letterSpacing: '-0.035em', color: T.text, margin: '0 0 4px', lineHeight: 1.2 }}>
            {r.studentName ?? currentStudent?.name ?? '학생'} 생기부 심층 분석
          </h1>
          <div style={{ fontSize: 15, color: T.textMuted }}>
            {[r.school, r.grade, r.targetDept && `희망 ${r.targetDept}`].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowGuide(true)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: T.surface, color: T.textMuted, border: `1px solid ${T.borderStrong}`, cursor: 'pointer', fontFamily: FONT }}>분석 가이드</button>
          <button onClick={() => setShowCriteria(true)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: T.surface, color: T.textMuted, border: `1px solid ${T.borderStrong}`, cursor: 'pointer', fontFamily: FONT }}>평가 기준</button>
          <button onClick={handlePDF} disabled={isPrinting} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: T.surface, color: T.textMuted, border: `1px solid ${T.borderStrong}`, cursor: 'pointer', fontFamily: FONT }}>
            {isPrinting ? 'PDF 생성 중...' : 'PDF 저장'}
          </button>
          <button onClick={() => window.print()} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: T.surface, color: T.textMuted, border: `1px solid ${T.borderStrong}`, cursor: 'pointer', fontFamily: FONT }}>인쇄</button>
          <button onClick={handleReanalyze} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: T.primary, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT }}>재분석</button>
        </div>
      </div>

      {/* 역량 점수 카드 3개 + 종합 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <ScoreBadge score={r.scores.academic} label="학업역량" color={COMP_COLOR.academic} />
        <ScoreBadge score={r.scores.career} label="진로역량" color={COMP_COLOR.career} />
        <ScoreBadge score={r.scores.community} label="공동체역량" color={COMP_COLOR.community} />
        <div style={{ background: T.primarySoft, border: `1px solid ${T.primaryBorder}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: T.primary }} />
          <div style={{ fontSize: 13, color: T.primary, fontWeight: 600, marginBottom: 6 }}>성적 종합 평균</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: T.primary, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgAll != null ? avgAll.toFixed(2) : '-'}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            {r.groupAverages.kems != null && `국영수사과 ${r.groupAverages.kems.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* 역량 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {([['academic', '학업역량', COMP_COLOR.academic], ['career', '진로역량', COMP_COLOR.career], ['community', '공동체역량', COMP_COLOR.community]] as const).map(([key, label, color]) => (
          <div key={key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.04em', marginBottom: 6 }}>{label} 요약</div>
            <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65 }}>{r.summaryHighlights[key]}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${T.border}`, gap: 0 }}>
        {([['report', '심층 분석 리포트'], ['grades', '성적 분석'], ['activities', '활동 상세']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '10px 20px', fontSize: 15, fontWeight: tab === k ? 700 : 500,
            color: tab === k ? T.primary : T.textMuted,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
            borderBottom: tab === k ? `2px solid ${T.primary}` : '2px solid transparent',
            marginBottom: -2,
          }}>{l}</button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'report' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* 마크다운 리포트 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, gridColumn: '1 / -1' }}>
            <div className="segibu-report" style={{ fontSize: 15, lineHeight: 1.8, color: T.text, fontFamily: FONT }}>
              <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{r.report}</Markdown>
            </div>
          </div>
          {/* 레이더 + 향후 전략 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 12 }}>3대 역량 레이더</div>
            <CompRadar scores={r.scores} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 12 }}>향후 전략 제언</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.primary, marginBottom: 6 }}>심화 탐구 제안</div>
            <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7, marginBottom: 14 }}>{r.futureStrategy.deepDive}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.warning, marginBottom: 6 }}>연계 과목</div>
            <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7 }}>{r.futureStrategy.subjects}</div>
          </div>
        </div>
      )}

      {tab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>학기별 교과 성적 추이</div>
            <GradeLineChart grades={r.grades} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>교과별 성적 매트릭스</div>
            <GradeTable grades={r.grades} />
            <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {([['all','전과목'], ['kems','국영수사과'], ['kemSo','국영수사'], ['kemSc','국영수과']] as const).map(([k,l]) => (
                r.groupAverages[k] != null && (
                  <div key={k} style={{ fontSize: 13, color: T.textMuted }}>
                    <span style={{ fontWeight: 700, color: T.text }}>{l}</span> {r.groupAverages[k]!.toFixed(2)}등급
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'activities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 창체 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>창의적 체험활동</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {ACTIVITY_TABS.map(t => (
                <button key={t.key} onClick={() => setActivityCategory(t.key)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: activityCategory === t.key ? 700 : 500,
                  background: activityCategory === t.key ? T.primary : T.bgAlt,
                  color: activityCategory === t.key ? '#fff' : T.textMuted,
                  border: 'none', cursor: 'pointer', fontFamily: FONT,
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['y1','y2','y3'] as const).map((y, i) => (
                <button key={y} onClick={() => setYearTab(y)} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: yearTab === y ? 700 : 400,
                  background: yearTab === y ? T.bgAlt : 'transparent',
                  color: yearTab === y ? T.text : T.textSubtle,
                  border: `1px solid ${yearTab === y ? T.borderStrong : 'transparent'}`, cursor: 'pointer', fontFamily: FONT,
                }}>{i+1}학년</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: T.bgAlt, borderRadius: 10, fontSize: 14, color: T.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 6 }}>원본 기록</div>
                {r.structuredData.changche[activityCategory][yearTab] || '해당 없음'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 6 }}>역량 하이라이트</div>
                <HighlightCard highlight={r.highlights.changche[activityCategory][yearTab]} />
              </div>
            </div>
          </div>

          {/* 교과 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>교과 세특</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {CURRICULUM_TABS.map(t => (
                <button key={t.key} onClick={() => setCurriculumKey(t.key)} style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: curriculumKey === t.key ? 700 : 500,
                  background: curriculumKey === t.key ? T.primary : T.bgAlt,
                  color: curriculumKey === t.key ? '#fff' : T.textMuted,
                  border: 'none', cursor: 'pointer', fontFamily: FONT,
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['y1','y2','y3'] as const).map((y, i) => (
                <button key={y} onClick={() => setYearTab(y)} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: yearTab === y ? 700 : 400,
                  background: yearTab === y ? T.bgAlt : 'transparent',
                  color: yearTab === y ? T.text : T.textSubtle,
                  border: `1px solid ${yearTab === y ? T.borderStrong : 'transparent'}`, cursor: 'pointer', fontFamily: FONT,
                }}>{i+1}학년</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: T.bgAlt, borderRadius: 10, fontSize: 14, color: T.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 6 }}>원본 기록</div>
                {r.structuredData.curriculum[curriculumKey][yearTab] || '해당 없음'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 6 }}>역량 하이라이트</div>
                <HighlightCard highlight={r.highlights.curriculum[curriculumKey][yearTab]} />
              </div>
            </div>
          </div>

          {/* 행동특성 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>행동특성 및 종합의견</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['y1','y2','y3'] as const).map((y, i) => (
                <button key={y} onClick={() => setYearTab(y)} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: yearTab === y ? 700 : 400,
                  background: yearTab === y ? T.bgAlt : 'transparent',
                  color: yearTab === y ? T.text : T.textSubtle,
                  border: `1px solid ${yearTab === y ? T.borderStrong : 'transparent'}`, cursor: 'pointer', fontFamily: FONT,
                }}>{i+1}학년</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: T.bgAlt, borderRadius: 10, fontSize: 14, color: T.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 6 }}>원본 기록</div>
                {r.structuredData.behavior[yearTab] || '해당 없음'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 6 }}>역량 하이라이트</div>
                <HighlightCard highlight={r.highlights.behavior[yearTab]} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <Popup title="분석 가이드" onClose={() => setShowGuide(false)}>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: T.textMuted }}>
            <Markdown remarkPlugins={[remarkGfm]}>{GUIDE_CONTENT}</Markdown>
          </div>
        </Popup>
      )}
      {showCriteria && (
        <Popup title="평가 기준 (입학사정관 관점)" onClose={() => setShowCriteria(false)}>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: T.textMuted }}>
            <Markdown remarkPlugins={[remarkGfm]}>{CRITERIA_CONTENT}</Markdown>
          </div>
        </Popup>
      )}
    </div>
  );
}
