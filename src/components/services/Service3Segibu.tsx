'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { SegibuAnalysis, GradeMatrix, CategoryGrades } from '@/types/analysis';
import { StudentReportView } from '@/components/services/StudentReportView';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

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

const COMP_LABELS: Record<keyof SegibuAnalysis['scores'], string> = {
  academic: '학업역량',
  career: '진로역량',
  community: '공동체역량',
};

const SERVICE_LABELS: Record<NonNullable<SegibuAnalysis['admissionsReadiness']>['nextActions'][number]['linkedService'], string> = {
  university: '대학 찾기',
  subject: '과목 설계',
  seteuk: '세특 설계',
  report: '상담 리포트',
};

// ── 분석 단계 라벨 ────────────────────────────────────────────────────────────
const STAGES = [
  { until: 25, label: '생기부 내용을 읽는 중...' },
  { until: 55, label: 'AI가 생기부 내용을 파악하는 중...' },
  { until: 78, label: '역량 점수 및 성적 분석 중...' },
  { until: 92, label: '심층 리포트 생성 중...' },
  { until: 100, label: '거의 다 됐어요!' },
];

// ── 유틸 ──────────────────────────────────────────────────────────────────────
// AI가 문자열 대신 객체를 반환할 경우 안전하게 문자열로 변환
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStr(v: any): string {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  if (typeof v === 'object') return Object.values(v).filter(Boolean).join(' / ');
  return String(v);
}

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

  const allVals = data.flatMap(d => keys.map(k => d[k as keyof typeof d] as number | null)).filter((v): v is number => v != null);
  const minGrade = allVals.length > 0 ? Math.max(1, Math.floor(Math.min(...allVals)) - 1) : 1;
  const maxGrade = allVals.length > 0 ? Math.min(9, Math.ceil(Math.max(...allVals)) + 1) : 9;
  const ticks = Array.from({ length: maxGrade - minGrade + 1 }, (_, i) => minGrade + i);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
        <XAxis dataKey="sem" tick={{ fontSize: 12, fill: T.textMuted, fontFamily: FONT }} />
        <YAxis reversed domain={[minGrade, maxGrade]} ticks={ticks} tick={{ fontSize: 11, fill: T.textMuted }} />
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

type RedactionZone = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextBox = RedactionZone & {
  pageIndex: number;
  text: string;
  normalizedText: string;
};

type TextLine = {
  pageIndex: number;
  normalizedText: string;
  boxes: Array<TextBox & { start: number; end: number }>;
};

type RedactionCandidate = {
  text: string;
  normalizedText: string;
  source: 'institution' | 'fixed-zone-name' | 'manual';
};

type RedactionBuildSummary = {
  pages: number;
  textLayerFound: boolean;
  autoCandidateCount: number;
  manualCandidateCount: number;
  dynamicZoneCount: number;
  previewSizeBytes: number;
  sanitizedTextChars: number;
  renderScale: number;
  jpegQuality: number;
};

type RedactedSegibuResult = {
  file: File;
  sanitizedText: string;
  summary: RedactionBuildSummary;
};

type PdfTextItemLike = {
  str?: unknown;
  transform?: unknown;
  width?: unknown;
  height?: unknown;
};

type PdfTextContentLike = {
  items?: unknown;
};

type PdfViewportLike = {
  width: number;
  height: number;
};

type PdfPageProxyLike = {
  getViewport: (args: { scale: number }) => PdfViewportLike;
  getTextContent: () => Promise<PdfTextContentLike>;
  render: (params: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: unknown;
  }) => { promise: Promise<unknown> };
};

type PdfDocumentProxyLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxyLike>;
};

const PDFJS_WORKER_SRC = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
const SEGIBU_TEXT_UPLOAD_LIMIT_BYTES = 3.5 * 1024 * 1024;
const REDACTION_PADDING = 0.004;
const DYNAMIC_REDACTION_PADDING = 0.006;
const REDACTION_RENDER_PROFILES = [
  { scale: 1.45, quality: 0.8 },
  { scale: 1.25, quality: 0.72 },
  { scale: 1.05, quality: 0.64 },
  { scale: 0.9, quality: 0.56 },
] as const;
const IDENTIFIER_STOPWORDS = new Set([
  '학년', '학기', '학과', '구분', '번호', '성명', '담임성명', '졸업대장번호', '수상명', '등급', '수상연월일',
  '참가대상', '수강자', '특기사항', '결과', '출결상황', '자격증', '인증', '취득상황', '해당사항없음',
  '학교생활', '학교생활기록부', '고등학교', '중학교', '초등학교',
]);
const INSTITUTION_PATTERN = /(?:\([^)]+\))?[가-힣A-Za-z0-9·.\-]{2,40}(?:초등학교|중학교|고등학교|여자고등학교|남자고등학교|고교|여고|남고)/g;

function getFixedSegibuRedactionZones(pageIndex: number): RedactionZone[] {
  const zones: RedactionZone[] = [
    // 모든 페이지 하단 출력 학교명/출력일/반/번호/성명 영역.
    { x: 0, y: 0, width: 1, height: 0.08 },
  ];

  if (pageIndex === 0) {
    zones.push(
      // 1페이지 제목 아래 졸업대장번호/학적사항/담임/사진 블록 전체.
      { x: 0.04, y: 0.515, width: 0.92, height: 0.345 },
      // 1페이지 수상경력 표의 수여기관 컬럼만.
      { x: 0.63, y: 0.19, width: 0.19, height: 0.20 },
    );
  }

  if (pageIndex === 3) {
    zones.push(
      // 4페이지 봉사활동실적의 장소 또는 주관기관명 컬럼.
      { x: 0.37, y: 0.075, width: 0.19, height: 0.19 },
    );
  }

  if (pageIndex === 4) {
    zones.push(
      // 5페이지 봉사활동실적의 장소 또는 주관기관명 컬럼.
      { x: 0.37, y: 0.575, width: 0.19, height: 0.30 },
    );
  }

  return zones;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function expandZone(zone: RedactionZone, padding = REDACTION_PADDING): RedactionZone {
  const x = clamp01(zone.x - padding);
  const y = clamp01(zone.y - padding);
  const right = clamp01(zone.x + zone.width + padding);
  const top = clamp01(zone.y + zone.height + padding);
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, top - y) };
}

function zoneContainsPoint(zone: RedactionZone, x: number, y: number) {
  return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
}

function zoneOverlapsBox(zone: RedactionZone, box: RedactionZone) {
  return zone.x < box.x + box.width
    && zone.x + zone.width > box.x
    && zone.y < box.y + box.height
    && zone.y + zone.height > box.y;
}

function isInFixedZone(box: TextBox) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return getFixedSegibuRedactionZones(box.pageIndex).some((zone) => zoneContainsPoint(expandZone(zone, 0.012), cx, cy));
}

function normalizeIdentifier(value: string) {
  return value.replace(/[\s,.:;|/\\]+/g, '').trim();
}

function normalizeManualTerms(value: string) {
  return value
    .split(/[\n,]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanCandidate(value: string) {
  return value.trim().replace(/[()[\]{}<>「」『』,.:;]+$/g, '');
}

function isLikelyInstitution(value: string) {
  const normalized = normalizeIdentifier(value);
  if (normalized.length < 5) return false;
  if (IDENTIFIER_STOPWORDS.has(normalized)) return false;
  if (/(?:교육과정|생활기록|학교생활|학생부|학교폭력|학교주변|고등학교생활)/.test(normalized)) return false;
  return /(초등학교|중학교|고등학교|고교|여고|남고)$/.test(normalized);
}

function isLikelyNameFromFixedZone(value: string) {
  const normalized = normalizeIdentifier(value);
  if (!/^[가-힣]{2,4}$/.test(normalized)) return false;
  return !IDENTIFIER_STOPWORDS.has(normalized);
}

function addCandidate(map: Map<string, RedactionCandidate>, text: string, source: RedactionCandidate['source']) {
  const cleaned = cleanCandidate(text);
  const normalizedText = normalizeIdentifier(cleaned);
  if (!normalizedText || normalizedText.length < 2) return;
  if (IDENTIFIER_STOPWORDS.has(normalizedText)) return;
  map.set(normalizedText, { text: cleaned, normalizedText, source });
}

function textItemToBox(item: PdfTextItemLike, pageIndex: number, pageWidth: number, pageHeight: number): TextBox | null {
  const text = typeof item.str === 'string' ? item.str.trim() : '';
  const transform = Array.isArray(item.transform) ? item.transform : [];
  if (!text || transform.length < 6) return null;
  const xValue = Number(transform[4]);
  const yValue = Number(transform[5]);
  const fontHeight = Number(item.height) || Math.abs(Number(transform[3])) || 9;
  const widthValue = Number(item.width) || Math.max(fontHeight * 0.55 * text.length, fontHeight);
  if (!Number.isFinite(xValue) || !Number.isFinite(yValue) || !Number.isFinite(widthValue)) return null;

  return {
    pageIndex,
    text,
    normalizedText: normalizeIdentifier(text),
    x: clamp01(xValue / pageWidth),
    y: clamp01((yValue - fontHeight * 0.25) / pageHeight),
    width: clamp01(widthValue / pageWidth),
    height: clamp01((fontHeight * 1.25) / pageHeight),
  };
}

async function extractPageTextBoxes(page: PdfPageProxyLike, pageIndex: number, viewport: PdfViewportLike): Promise<TextBox[]> {
  const textContent = await page.getTextContent();
  const items = Array.isArray(textContent.items) ? textContent.items : [];
  return items
    .map((item) => textItemToBox(item as PdfTextItemLike, pageIndex, viewport.width, viewport.height))
    .filter((box): box is TextBox => Boolean(box && box.normalizedText));
}

function buildTextLines(boxes: TextBox[]): TextLine[] {
  const sorted = [...boxes].sort((a, b) => a.pageIndex - b.pageIndex || b.y - a.y || a.x - b.x);
  const lines: TextBox[][] = [];

  for (const box of sorted) {
    const centerY = box.y + box.height / 2;
    const line = lines.find((items) => {
      const first = items[0];
      if (!first || first.pageIndex !== box.pageIndex) return false;
      const firstCenterY = first.y + first.height / 2;
      return Math.abs(firstCenterY - centerY) < 0.006;
    });
    if (line) line.push(box);
    else lines.push([box]);
  }

  return lines.map((items) => {
    const boxesInLine = [...items].sort((a, b) => a.x - b.x);
    let cursor = 0;
    const boxesWithIndexes = boxesInLine.map((box) => {
      const start = cursor;
      cursor += box.normalizedText.length;
      return { ...box, start, end: cursor };
    });
    return {
      pageIndex: boxesWithIndexes[0]?.pageIndex ?? 0,
      normalizedText: boxesWithIndexes.map((box) => box.normalizedText).join(''),
      boxes: boxesWithIndexes,
    };
  });
}

function collectRedactionCandidates(boxes: TextBox[], manualTerms: string[]) {
  const map = new Map<string, RedactionCandidate>();

  for (const box of boxes) {
    for (const match of box.text.matchAll(INSTITUTION_PATTERN)) {
      const value = match[0];
      if (isLikelyInstitution(value)) addCandidate(map, value, 'institution');
      const withoutPrefix = value.replace(/^\([^)]+\)/, '');
      if (withoutPrefix !== value && isLikelyInstitution(withoutPrefix)) addCandidate(map, withoutPrefix, 'institution');
    }
    if (isInFixedZone(box) && isLikelyNameFromFixedZone(box.text)) {
      addCandidate(map, box.text, 'fixed-zone-name');
    }
  }

  for (const term of manualTerms) {
    addCandidate(map, term, 'manual');
  }

  return [...map.values()];
}

function zonesForCandidateInLine(line: TextLine, candidate: RedactionCandidate): RedactionZone[] {
  const zones: RedactionZone[] = [];
  const candidateLength = candidate.normalizedText.length;
  if (candidateLength === 0) return zones;

  let searchFrom = 0;
  while (searchFrom < line.normalizedText.length) {
    const index = line.normalizedText.indexOf(candidate.normalizedText, searchFrom);
    if (index < 0) break;
    const endIndex = index + candidateLength;
    for (const box of line.boxes) {
      const overlapStart = Math.max(index, box.start);
      const overlapEnd = Math.min(endIndex, box.end);
      if (overlapEnd <= overlapStart) continue;
      const boxLength = Math.max(1, box.end - box.start);
      const startRatio = (overlapStart - box.start) / boxLength;
      const endRatio = (overlapEnd - box.start) / boxLength;
      zones.push(expandZone({
        x: box.x + box.width * startRatio,
        y: box.y,
        width: box.width * Math.max(0, endRatio - startRatio),
        height: box.height,
      }, DYNAMIC_REDACTION_PADDING));
    }
    searchFrom = endIndex;
  }

  return zones;
}

function collectDynamicRedactionZones(boxes: TextBox[], manualTerms: string[]) {
  const candidates = collectRedactionCandidates(boxes, manualTerms);
  const lines = buildTextLines(boxes);
  const zonesByPage = new Map<number, RedactionZone[]>();

  for (const line of lines) {
    for (const candidate of candidates) {
      if (!line.normalizedText.includes(candidate.normalizedText)) continue;
      const zones = zonesForCandidateInLine(line, candidate);
      const current = zonesByPage.get(line.pageIndex) ?? [];
      current.push(...zones);
      zonesByPage.set(line.pageIndex, current);
    }
  }

  return {
    candidates,
    zonesByPage,
    dynamicZoneCount: [...zonesByPage.values()].reduce((sum, zones) => sum + zones.length, 0),
  };
}

function drawPrivacyMask(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = '#D7DEE8';
  ctx.fillRect(x, y, width, height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.strokeStyle = 'rgba(104, 117, 137, 0.42)';
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.045);
  const gap = Math.max(8, Math.min(width, height) * 0.18);
  for (let offset = -height; offset < width + height; offset += gap) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + height);
    ctx.lineTo(x + offset + height, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(97, 111, 132, 0.55)';
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.018);
  ctx.strokeRect(x, y, width, height);
}

function drawRedactionZones(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, zones: RedactionZone[]) {
  ctx.save();
  for (const zone of zones) {
    drawPrivacyMask(
      ctx,
      zone.x * canvas.width,
      (1 - zone.y - zone.height) * canvas.height,
      zone.width * canvas.width,
      zone.height * canvas.height,
    );
  }
  ctx.restore();
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.ceil(bytes / 1024)}KB`;
}

function isTextBoxRedacted(box: TextBox, dynamicZonesByPage: Map<number, RedactionZone[]>) {
  const fixedZones = getFixedSegibuRedactionZones(box.pageIndex).map((zone) => expandZone(zone, REDACTION_PADDING));
  const dynamicZones = dynamicZonesByPage.get(box.pageIndex) ?? [];
  return [...fixedZones, ...dynamicZones].some((zone) => zoneOverlapsBox(zone, box));
}

function buildSanitizedSegibuText(
  pages: Array<{ boxes: TextBox[] }>,
  dynamicZonesByPage: Map<number, RedactionZone[]>,
) {
  const chunks: string[] = [];

  pages.forEach((pageData, pageIndex) => {
    const visibleBoxes = pageData.boxes
      .filter((box) => !isTextBoxRedacted(box, dynamicZonesByPage))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: TextBox[][] = [];

    for (const box of visibleBoxes) {
      const centerY = box.y + box.height / 2;
      const line = lines.find((items) => {
        const first = items[0];
        if (!first) return false;
        const firstCenterY = first.y + first.height / 2;
        return Math.abs(firstCenterY - centerY) < 0.006;
      });
      if (line) line.push(box);
      else lines.push([box]);
    }

    const pageText = lines
      .map((items) => items.sort((a, b) => a.x - b.x).map((box) => box.text).join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');

    if (pageText) chunks.push(`[${pageIndex + 1}쪽]\n${pageText}`);
  });

  return chunks.join('\n\n').trim();
}

function getRedactionProfiles(pageCount: number): Array<{ scale: number; quality: number }> {
  if (pageCount <= 5) return [...REDACTION_RENDER_PROFILES];
  if (pageCount <= 10) {
    return [
      { scale: 1.25, quality: 0.72 },
      { scale: 1.1, quality: 0.66 },
      { scale: 0.95, quality: 0.58 },
      { scale: 0.82, quality: 0.52 },
    ];
  }
  return [
    { scale: 1.1, quality: 0.66 },
    { scale: 0.95, quality: 0.58 },
    { scale: 0.82, quality: 0.52 },
    { scale: 0.72, quality: 0.48 },
  ];
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PDF 페이지 이미지를 만들지 못했습니다.'));
    }, 'image/jpeg', quality);
  });
}

async function buildRedactedPdfBytes(
  sourcePdf: PdfDocumentProxyLike,
  pages: Array<{ page: PdfPageProxyLike; pdfViewport: PdfViewportLike; boxes: TextBox[] }>,
  dynamic: ReturnType<typeof collectDynamicRedactionZones>,
  profile: { scale: number; quality: number },
): Promise<Uint8Array> {
  const outputPdf = await PDFDocument.create();

  for (let pageIndex = 0; pageIndex < sourcePdf.numPages; pageIndex += 1) {
    const { page: sourcePage, pdfViewport } = pages[pageIndex];
    const renderViewport = sourcePage.getViewport({ scale: profile.scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(renderViewport.width);
    canvas.height = Math.ceil(renderViewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('PDF 페이지를 렌더링할 수 없습니다.');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await sourcePage.render({ canvas, canvasContext: ctx, viewport: renderViewport }).promise;
    drawRedactionZones(ctx, canvas, [
      ...getFixedSegibuRedactionZones(pageIndex).map((zone) => expandZone(zone, REDACTION_PADDING)),
      ...(dynamic.zonesByPage.get(pageIndex) ?? []),
    ]);

    const imageBlob = await canvasToBlob(canvas, profile.quality);
    const imageBytes = await imageBlob.arrayBuffer();
    const image = await outputPdf.embedJpg(imageBytes);
    const outputPage = outputPdf.addPage([pdfViewport.width, pdfViewport.height]);
    outputPage.drawImage(image, { x: 0, y: 0, width: pdfViewport.width, height: pdfViewport.height });
    canvas.width = 0;
    canvas.height = 0;
  }

  return outputPdf.save();
}

async function createRedactedSegibuFile(file: File, additionalTerms: string): Promise<RedactedSegibuResult> {
  const source = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

  const sourcePdf = await (pdfjs.getDocument({ data: source.slice() }) as unknown as { promise: Promise<PdfDocumentProxyLike> }).promise;
  const pages: Array<{ page: PdfPageProxyLike; pdfViewport: PdfViewportLike; boxes: TextBox[] }> = [];

  for (let pageIndex = 0; pageIndex < sourcePdf.numPages; pageIndex += 1) {
    const page = await sourcePdf.getPage(pageIndex + 1);
    const pdfViewport = page.getViewport({ scale: 1 });
    const boxes = await extractPageTextBoxes(page, pageIndex, pdfViewport);
    pages.push({ page, pdfViewport, boxes });
  }

  const manualTerms = normalizeManualTerms(additionalTerms);
  const allBoxes = pages.flatMap((pageData) => pageData.boxes);
  if (allBoxes.length === 0) {
    throw new Error('이 PDF는 텍스트 레이어를 찾지 못했습니다. 스캔본은 현재 자동 분석할 수 없으므로 OCR 후 텍스트 붙여넣기 방식으로 진행해 주세요.');
  }
  const dynamic = collectDynamicRedactionZones(allBoxes, manualTerms);
  const sanitizedText = buildSanitizedSegibuText(pages, dynamic.zonesByPage);
  const sanitizedTextBytes = new TextEncoder().encode(sanitizedText).byteLength;
  if (sanitizedText.trim().length < 100) {
    throw new Error('비식별 처리 후 분석 가능한 텍스트가 너무 적습니다. 원본 PDF의 텍스트 복사 가능 여부를 확인하거나 텍스트 붙여넣기 방식으로 진행해 주세요.');
  }
  if (sanitizedTextBytes > SEGIBU_TEXT_UPLOAD_LIMIT_BYTES) {
    throw new Error(`비식별 텍스트가 ${formatBytes(sanitizedTextBytes)}로 전송 권장 한도 ${formatBytes(SEGIBU_TEXT_UPLOAD_LIMIT_BYTES)}를 초과했습니다. 학기별로 나누어 분석하거나 텍스트를 줄여 다시 시도해 주세요.`);
  }
  const profiles = getRedactionProfiles(sourcePdf.numPages);
  let redactedBytes: Uint8Array | null = null;
  let usedProfile = profiles[profiles.length - 1];

  for (const profile of profiles) {
    const candidateBytes = await buildRedactedPdfBytes(sourcePdf, pages, dynamic, profile);
    redactedBytes = candidateBytes;
    usedProfile = profile;
    if (candidateBytes.byteLength <= 4 * 1024 * 1024) break;
  }

  if (!redactedBytes) throw new Error('PDF 비식별화 미리보기를 만들지 못했습니다.');

  const redactedArrayBuffer = redactedBytes.buffer.slice(
    redactedBytes.byteOffset,
    redactedBytes.byteOffset + redactedBytes.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([redactedArrayBuffer], { type: 'application/pdf' });
  const safeName = file.name.replace(/\.pdf$/i, '') || 'segibu';
  return {
    file: new File([blob], `${safeName}_비식별확인.pdf`, { type: 'application/pdf' }),
    sanitizedText,
    summary: {
      pages: sourcePdf.numPages,
      textLayerFound: allBoxes.length > 0,
      autoCandidateCount: dynamic.candidates.filter((candidate) => candidate.source !== 'manual').length,
      manualCandidateCount: manualTerms.length,
      dynamicZoneCount: dynamic.dynamicZoneCount,
      previewSizeBytes: redactedBytes.byteLength,
      sanitizedTextChars: sanitizedText.length,
      renderScale: usedProfile.scale,
      jpegQuality: usedProfile.quality,
    },
  };
}

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

function PrivacyLockedRecord({ label = '원본 기록' }: { label?: string }) {
  return (
    <div style={{ position: 'relative', padding: 14, background: T.bgAlt, borderRadius: 10, minHeight: 132, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 8 }}>{label}</div>
      <div aria-hidden="true" style={{ filter: 'blur(5px)', opacity: 0.35, userSelect: 'none', pointerEvents: 'none' }}>
        {[1, 2, 3, 4].map((line) => (
          <div key={line} style={{ height: 12, width: `${92 - line * 9}%`, borderRadius: 999, background: line % 2 ? '#CBD5E1' : '#DDE3EA', marginBottom: 10 }} />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, textAlign: 'center', background: 'rgba(248,250,252,0.72)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: T.surface, border: `1px solid ${T.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 11, fontWeight: 900 }}>LOCK</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>개인정보 보호 잠금</div>
        <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.5 }}>생기부 원문과 원문 인용은 저장·출력하지 않습니다. 상담에는 오른쪽 역량 하이라이트와 처방 요약을 사용하세요.</div>
      </div>
    </div>
  );
}

function ReadinessSummary({ readiness }: { readiness: NonNullable<SegibuAnalysis['admissionsReadiness']> }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, gridColumn: '1 / -1' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>상담 처방 요약</div>
      <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7, marginBottom: 14 }}>{readiness.overall}</div>

      {readiness.criticalWeaknesses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 14 }}>
          {readiness.criticalWeaknesses.slice(0, 3).map((item, index) => (
            <div key={`${item.competency}-${index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', background: T.surfaceAlt, borderLeft: `3px solid ${COMP_COLOR[item.competency]}` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: COMP_COLOR[item.competency], marginBottom: 5 }}>{COMP_LABELS[item.competency]} 보완</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.45, marginBottom: 5 }}>{item.issue}</div>
              <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.55 }}>{item.recommendation}</div>
            </div>
          ))}
        </div>
      )}

      {readiness.nextActions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {readiness.nextActions.slice(0, 4).map(action => (
            <div key={`${action.priority}-${action.action}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 9, background: T.bgAlt, border: `1px solid ${T.border}` }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: T.primary, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{action.priority}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: T.primary }}>{SERVICE_LABELS[action.linkedService]}</span>
              <span style={{ fontSize: 13, color: T.textMuted }}>{action.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 입시 인사이트 카드 데이터 ─────────────────────────────────────────────────
const INSIGHTS = [
  {
    tag: '학업역량',
    color: COMP_COLOR.academic,
    title: '학업역량 — 입학사정관이 보는 것',
    points: [
      '성적 숫자보다 탐구 과정과 지적 호기심이 핵심',
      '교과 세특에 자발적 심화 탐구 내용이 담겼는지',
      '1·2학년 대비 3학년의 성장 서사와 향상 추이',
    ],
    note: '전국 평균 등급이 높아도 세특이 빈약하면 상위권 대학에서 낮게 평가됩니다.',
  },
  {
    tag: '진로역량',
    color: COMP_COLOR.career,
    title: '진로역량 — 입학사정관이 보는 것',
    points: [
      '희망 학과와 교과·활동 간의 구체적 연결 고리',
      '진로 관련 독서·탐구·활동의 3년간 일관성',
      '막연한 꿈이 아닌 탐색·실행·반성의 흔적',
    ],
    note: '세 역량 중 가장 소홀하기 쉬운 영역입니다. 학과 연계 활동이 적으면 지원 적합성에서 감점됩니다.',
  },
  {
    tag: '공동체역량',
    color: COMP_COLOR.community,
    title: '공동체역량 — 입학사정관이 보는 것',
    points: [
      '봉사 시간 총합보다 협력·배려·소통의 구체적 내용',
      '리더 역할과 팔로워 역할 — 상황에 따른 유연함',
      '갈등 상황에서 문제를 해결하는 과정과 성장',
    ],
    note: '단체활동 결과보다 개인이 어떤 역할을 했는지, 무엇을 배웠는지가 평가의 핵심입니다.',
  },
  {
    tag: '생기부 전략',
    color: '#6366F1',
    title: '합격을 결정하는 생기부 전략',
    points: [
      '기록되지 않은 활동은 없는 것 — 모든 활동을 남겨야',
      '자기소개서는 생기부의 해설서 — 내용 일관성이 생명',
      '학교별 특이 이력보다 역량의 일관된 서사가 강력',
    ],
    note: '입학사정관은 3년간 학생이 "어떤 사람으로 성장했는가"를 생기부 전체에서 읽어냅니다.',
  },
] as const;

// ── 프로그레스 바 포함 로딩 화면 ─────────────────────────────────────────────
function LoadingScreen({ fileName }: { fileName?: string }) {
  const [progress, setProgress] = useState(0);
  const [insightIdx, setInsightIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const stage = STAGES.find(s => progress < s.until)?.label ?? '거의 다 됐어요!';
  const insight = INSIGHTS[insightIdx];

  // 프로그레스 시뮬레이션
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

  // 인사이트 카드 자동 슬라이드 (5초)
  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setInsightIdx(i => (i + 1) % INSIGHTS.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ fontFamily: FONT, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* 왼쪽: 분석 진행 상태 */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: T.textSubtle, textTransform: 'uppercase', marginBottom: 10 }}>AI 분석 진행 중</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 6 }}>
            생기부를 읽고<br />역량을 분석하고 있어요
          </div>
          {fileName && (
            <div style={{ fontSize: 13, color: T.textMuted, background: T.bgAlt, display: 'inline-block', padding: '3px 10px', borderRadius: 6, marginTop: 4 }}>{fileName}</div>
          )}
        </div>

        {/* 프로그레스 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 14, color: T.textMuted, fontWeight: 500 }}>{stage}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.primary, letterSpacing: '-0.04em' }}>{Math.round(progress)}%</div>
          </div>
          <div style={{ width: '100%', height: 8, background: T.bgAlt, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${T.primary}, #5B9BFF)`, borderRadius: 8, transition: 'width 0.35s ease-out' }} />
          </div>
        </div>

        {/* 단계별 체크리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STAGES.slice(0, -1).map((s, i) => {
            const done = progress >= s.until;
            const active = !done && progress >= (STAGES[i - 1]?.until ?? 0);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? T.primary : active ? T.primarySoft : T.bgAlt,
                  border: `2px solid ${done ? T.primary : active ? T.primary : T.border}`,
                  transition: 'all 0.3s',
                }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary }} />}
                </div>
                <div style={{ fontSize: 13, color: done ? T.textMuted : active ? T.text : T.textSubtle, fontWeight: active ? 600 : 400, transition: 'color 0.3s' }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 13, color: T.textSubtle, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          보통 15~40초 정도 걸려요. 기다리는 동안 오른쪽 내용을 함께 살펴보세요.
        </div>
      </div>

      {/* 오른쪽: 입시 인사이트 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 카드 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted }}>기다리는 동안 — 입시 인사이트</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {INSIGHTS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFade(false); setTimeout(() => { setInsightIdx(i); setFade(true); }, 150); }}
                style={{ width: i === insightIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === insightIdx ? T.primary : T.border, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }}
              />
            ))}
          </div>
        </div>

        {/* 메인 인사이트 카드 */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '28px 28px 24px',
          borderTop: `4px solid ${insight.color}`,
          opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: insight.color, textTransform: 'uppercase', marginBottom: 10 }}>{insight.tag}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: '-0.025em', marginBottom: 18, lineHeight: 1.4 }}>{insight.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {insight.points.map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: insight.color, marginTop: 7, flexShrink: 0 }} />
                <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6 }}>{pt}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.bgAlt, borderLeft: `3px solid ${insight.color}`, borderRadius: '0 6px 6px 0', padding: '10px 14px' }}>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{insight.note}</div>
          </div>
        </div>

        {/* 3개 역량 요약 배지 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: '학업역량', color: COMP_COLOR.academic, desc: '지적 탐구력' },
            { label: '진로역량', color: COMP_COLOR.career, desc: '학과 연계성' },
            { label: '공동체역량', color: COMP_COLOR.community, desc: '협업·리더십' },
          ].map(({ label, color, desc }) => (
            <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: T.textSubtle }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 업로드 화면 ───────────────────────────────────────────────────────────────
function UploadScreen({ currentStudentName, onAnalyze, error }: {
  currentStudentName?: string;
  onAnalyze: (input: File | string) => void;
  error: string | null;
}) {
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [redactedUrl, setRedactedUrl] = useState<string | null>(null);
  const [sanitizedPdfText, setSanitizedPdfText] = useState('');
  const [extraRedactionTerms, setExtraRedactionTerms] = useState('');
  const [redactionSummary, setRedactionSummary] = useState<RedactionBuildSummary | null>(null);
  const [redactionLoading, setRedactionLoading] = useState(false);
  const [redactionError, setRedactionError] = useState<string | null>(null);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [text, setText] = useState('');
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const canSubmit = mode === 'pdf'
    ? Boolean(sanitizedPdfText.trim().length > 100 && privacyConfirmed && !redactionLoading)
    : text.trim().length > 100 && privacyConfirmed;

  const clearRedactedPreview = useCallback(() => {
    if (redactedUrl) URL.revokeObjectURL(redactedUrl);
    setRedactedUrl(null);
    setSanitizedPdfText('');
    setRedactionSummary(null);
  }, [redactedUrl]);

  const handlePdfFile = useCallback(async (nextFile: File | null) => {
    setFile(nextFile);
    setPrivacyConfirmed(false);
    setRedactionError(null);
    clearRedactedPreview();
    if (!nextFile) return;
    setRedactionLoading(true);
    try {
      const redacted = await createRedactedSegibuFile(nextFile, extraRedactionTerms);
      setSanitizedPdfText(redacted.sanitizedText);
      setRedactionSummary(redacted.summary);
      setRedactedUrl(URL.createObjectURL(redacted.file));
    } catch (e) {
      setRedactionError(e instanceof Error ? e.message : 'PDF 비식별화 미리보기를 만들지 못했습니다. 파일이 암호화되어 있거나 표준 PDF가 아닐 수 있습니다.');
    } finally {
      setRedactionLoading(false);
    }
  }, [clearRedactedPreview, extraRedactionTerms]);

  useEffect(() => () => {
    if (redactedUrl) URL.revokeObjectURL(redactedUrl);
  }, [redactedUrl]);

  return (
    <div style={{ fontFamily: FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, maxWidth: 580, margin: '40px auto' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4 }}>생기부 AI 심층 분석</div>
      <div style={{ fontSize: 15, color: T.textMuted, marginBottom: 20 }}>
        {currentStudentName ? `${currentStudentName} 학생의 ` : ''}생기부를 분석하여 역량·성적·활동을 종합 분석해드려요.
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: T.bgAlt, borderRadius: 10, padding: 3, gap: 2, marginBottom: 16 }}>
        {([{ key: 'pdf', label: 'PDF 업로드' }, { key: 'text', label: '텍스트 붙여넣기' }] as const).map(m => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              setPrivacyConfirmed(false);
            }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: FONT,
              background: mode === m.key ? T.surface : 'transparent',
              color: mode === m.key ? T.primary : T.textMuted,
              boxShadow: mode === m.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >{m.label}</button>
        ))}
      </div>

      {mode === 'pdf' ? (
        <>
          <div
            onClick={() => ref.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') void handlePdfFile(f); }}
            style={{ border: `2px dashed ${drag ? T.primary : T.borderStrong}`, borderRadius: 12, padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: drag ? T.primarySoft : T.bgAlt, transition: 'all 0.15s' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={T.textSubtle} strokeWidth="1.8" fill="none"/>
              <polyline points="14 2 14 8 20 8" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="12" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="9 15 12 12 15 15" stroke={T.textSubtle} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.textMuted }}>{file ? file.name : '생기부 PDF를 끌어다 놓거나 클릭해 선택'}</div>
            <div style={{ fontSize: 13, color: T.textSubtle }}>PDF는 서버에 보내지 않고, 브라우저에서 비식별 텍스트만 추출해 분석</div>
          </div>
          <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) void handlePdfFile(f); }} />
          {file && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 6 }}>
                추가로 전체 페이지에서 가릴 식별어
              </label>
              <textarea
                value={extraRedactionTerms}
                onChange={e => setExtraRedactionTerms(e.target.value)}
                placeholder="학생 이름, 담임/교사명, 학교 약칭, 기관명 등을 한 줄에 하나씩 입력"
                style={{ width: '100%', minHeight: 58, resize: 'vertical', boxSizing: 'border-box', borderRadius: 8, border: `1px solid ${T.borderStrong}`, padding: '9px 10px', fontSize: 13, color: T.text, lineHeight: 1.5, fontFamily: FONT, outline: 'none', background: '#fff' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <div style={{ fontSize: 12, color: T.textSubtle, lineHeight: 1.45 }}>
                  자동 탐지는 학교·기관명과 고정 개인정보 영역에서 나온 이름 후보만 가립니다. 과목명·활동내용은 자동 대상에서 제외합니다.
                </div>
                <button
                  type="button"
                  onClick={() => void handlePdfFile(file)}
                  disabled={redactionLoading}
                  style={{ flexShrink: 0, height: 32, padding: '0 11px', borderRadius: 8, border: `1px solid ${T.primaryBorder}`, background: redactionLoading ? T.bgAlt : T.primarySoft, color: redactionLoading ? T.textSubtle : T.primary, fontSize: 12.5, fontWeight: 800, cursor: redactionLoading ? 'default' : 'pointer', fontFamily: FONT }}
                >
                  미리보기 다시 만들기
                </button>
              </div>
            </div>
          )}
          {(redactionLoading || redactionError || redactedUrl) && (
            <div style={{ marginTop: 14, border: `1px solid ${redactionError ? '#FCA5A5' : T.border}`, borderRadius: 12, overflow: 'hidden', background: T.surfaceAlt }}>
              <div style={{ padding: '11px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>비식별화 미리보기</div>
                  <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 2 }}>1페이지 개인정보·사진, 전체 하단 출력정보를 고정 마스킹하고 학교·기관명·이름 후보는 텍스트 좌표로 2차 마스킹합니다. 분석에는 PDF 파일이 아니라 비식별 텍스트만 전송합니다.</div>
                </div>
                {redactionLoading && <div style={{ fontSize: 12, fontWeight: 800, color: T.primary }}>처리 중...</div>}
              </div>
              {redactionError ? (
                <div style={{ padding: 14, fontSize: 13, color: T.danger, lineHeight: 1.6 }}>{redactionError}</div>
              ) : redactedUrl ? (
                <>
                  <iframe title="비식별화 PDF 미리보기" src={redactedUrl} style={{ width: '100%', height: 260, border: 'none', background: '#fff' }} />
                  {redactionSummary && (
                    <div style={{ padding: '9px 14px', borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.textMuted, lineHeight: 1.5, background: '#fff' }}>
                      {redactionSummary.textLayerFound
                        ? `${redactionSummary.pages}쪽 확인 · 분석 텍스트 ${redactionSummary.sanitizedTextChars.toLocaleString()}자 · 미리보기 ${formatBytes(redactionSummary.previewSizeBytes)} · 자동 식별어 ${redactionSummary.autoCandidateCount}개 · 추가 식별어 ${redactionSummary.manualCandidateCount}개 · 2차 마스킹 영역 ${redactionSummary.dynamicZoneCount}개`
                        : `${redactionSummary.pages}쪽 확인 · 텍스트 레이어를 찾지 못했습니다. OCR 후 텍스트 붙여넣기 방식으로 진행하세요.`}
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 14px', borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <input type="checkbox" checked={privacyConfirmed} onChange={e => setPrivacyConfirmed(e.target.checked)} style={{ marginTop: 3 }} />
                    <span style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55 }}>
                      전체 페이지 미리보기와 비식별 처리 결과를 확인했으며, 남아 있는 민감정보가 있으면 추가 식별어를 입력하거나 원본 PDF를 수정한 뒤 다시 업로드하겠습니다.
                    </span>
                  </label>
                </>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="나이스(NEIS)에서 복사한 생기부 전체 텍스트를 여기에 붙여넣으세요.&#10;&#10;성적, 창체, 세특, 행동특성 등 모든 내용을 포함할수록 정확한 분석이 가능합니다."
            style={{
              width: '100%', boxSizing: 'border-box', height: 200,
              padding: '14px 16px', border: `1.5px solid ${T.border}`, borderRadius: 12,
              fontSize: 14, fontFamily: FONT, color: T.text, lineHeight: 1.6,
              resize: 'vertical', outline: 'none', background: T.bgAlt,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = T.primary; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
          />
          <div style={{ fontSize: 12, color: text.trim().length < 100 ? T.warning : T.success, marginTop: 5, fontWeight: 600 }}>
            {text.trim().length}자 {text.trim().length < 100 ? '(최소 100자 이상 입력)' : '입력됨'}
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 12px', borderRadius: 10, background: T.warningSoft, border: '1px solid #FCD34D', marginTop: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={privacyConfirmed} onChange={e => setPrivacyConfirmed(e.target.checked)} style={{ marginTop: 3 }} />
            <span style={{ fontSize: 13, color: '#92400E', lineHeight: 1.55 }}>
              붙여넣은 텍스트에서 학생 실명, 주민번호, 연락처, 주소, 출력자 등 직접 식별정보를 제거했습니다.
            </span>
          </label>
        </div>
      )}

      {error && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: T.dangerSoft, color: T.danger, fontSize: 14 }}>{error}</div>}
      <button
        onClick={() => {
          if (mode === 'pdf' && sanitizedPdfText.trim()) onAnalyze(sanitizedPdfText.trim());
          else if (mode === 'text' && text.trim()) onAnalyze(text.trim());
        }}
        disabled={!canSubmit}
        style={{ marginTop: 14, width: '100%', height: 48, borderRadius: 10, background: canSubmit ? T.primary : T.bgAlt, color: canSubmit ? '#fff' : T.textSubtle, border: 'none', fontSize: 16, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: FONT }}
      >
        AI 심층 분석 시작
      </button>
      <div style={{ marginTop: 8, fontSize: 12, color: T.textSubtle, lineHeight: 1.5, textAlign: 'center' }}>
        분석 시작 시 Gemini 호출 1회가 사용됩니다. 실패 시 같은 파일을 바로 반복 제출하지 말고 오류 내용을 먼저 확인하세요.
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function Service3Segibu() {
  const { segibuAnalysis, analyzeSegibu, clearSegibuAnalysis, analysisLoading, analysisError, currentStudent } = useStudent();
  const [tab, setTab] = useState<'summary' | 'report' | 'grades' | 'activities'>('summary');
  const [activityCategory, setActivityCategory] = useState<'individual' | 'club' | 'career_act'>('individual');
  const [curriculumKey, setCurriculumKey] = useState<'korean' | 'math' | 'english' | 'social' | 'science' | 'liberal' | 'arts_phys'>('korean');
  const [yearTab, setYearTab] = useState<'y1' | 'y2' | 'y3'>('y1');
  const [showGuide, setShowGuide] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const handleAnalyze = useCallback((input: File | string) => {
    setLastFileName(typeof input === 'string' ? '텍스트 입력' : input.name);
    analyzeSegibu(input);
  }, [analyzeSegibu]);

  const handleNewAnalysis = () => {
    if (!confirm('현재 저장된 상담 요약 분석을 지우고 새 분석을 시작할까요?')) return;
    void clearSegibuAnalysis();
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

  if (analysisLoading) return <LoadingScreen fileName={lastFileName ?? undefined} />;
  if (!segibuAnalysis) return <UploadScreen currentStudentName={currentStudent?.name} onAnalyze={handleAnalyze} error={analysisError} />;

  const r = segibuAnalysis;
  const avgAll = r.groupAverages.all;
  const readiness = r.admissionsReadiness;

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
          <button onClick={handleNewAnalysis} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: T.primary, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT }}>새 분석</button>
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
        {([['summary', '통합 리포트'], ['report', 'AI 분석 원문'], ['grades', '성적 분석'], ['activities', '학생부 심층분석']] as const).map(([k, l]) => (
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
      {tab === 'summary' && (
        <StudentReportView
          segibuAnalysis={r}
          studentName={currentStudent?.name}
          embedded
        />
      )}

      {tab === 'report' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {readiness && <ReadinessSummary readiness={readiness} />}

          <div style={{ gridColumn: '1 / -1' }}>
            <PrivacyLockedRecord label="AI 분석 원문" />
          </div>
          {/* 레이더 + 향후 전략 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 12 }}>3대 역량 레이더</div>
            <CompRadar scores={r.scores} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 12 }}>향후 전략 제언</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.primary, marginBottom: 6 }}>심화 탐구 제안</div>
            <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7, marginBottom: 14 }}>
              {toStr(r.futureStrategy.deepDive)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.warning, marginBottom: 6 }}>연계 과목</div>
            <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7 }}>
              {toStr(r.futureStrategy.subjects)}
            </div>
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
              <PrivacyLockedRecord />
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
              <PrivacyLockedRecord />
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
              <PrivacyLockedRecord />
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
