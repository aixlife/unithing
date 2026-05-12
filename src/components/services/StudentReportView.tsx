'use client';
import { useState } from 'react';
import { SegibuAnalysis } from '@/types/analysis';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

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

function stripPresentationMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function renderInlineMarkdown(value: string) {
  const parts = value.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} style={{ color: T.text, fontWeight: 850 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function RichText({
  value,
  fontSize = 16,
  color = T.textMuted,
  lineHeight = 1.75,
}: {
  value: unknown;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
}) {
  const text = toText(value).trim() || '-';
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize, color, lineHeight, fontFamily: FONT }}>
      {lines.map((line, index) => {
        const bullet = /^[-*]\s+/.test(line);
        const numbered = /^\d+[.)]\s+/.test(line);
        const content = line
          .replace(/^#{1,6}\s+/, '')
          .replace(/^[-*]\s+/, '')
          .replace(/^\d+[.)]\s+/, '');

        if (bullet || numbered) {
          return (
            <div key={`${index}-${content}`} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 7, alignItems: 'start' }}>
              <span style={{ color: T.primary, fontWeight: 900, lineHeight }}>{numbered ? `${line.match(/^\d+/)?.[0]}.` : '•'}</span>
              <span>{renderInlineMarkdown(content)}</span>
            </div>
          );
        }

        return <p key={`${index}-${content}`} style={{ margin: 0 }}>{renderInlineMarkdown(content)}</p>;
      })}
    </div>
  );
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
  const combined = texts.map(stripPresentationMarkdown).join(' ');
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
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: FONT }}>{label}</span>
        <span style={{ fontSize: 34, fontWeight: 900, color, fontFamily: FONT, lineHeight: 1 }}>{score}<span style={{ fontSize: 15, color: T.textSubtle, marginLeft: 3 }}>/100</span></span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: soft }}>
        <div style={{ height: '100%', borderRadius: 4, background: color, width: `${score}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function RadarTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const label = payload?.value ?? '';
  const lines = label === '공동체역량'
    ? ['공동체', '역량']
    : label === '학업역량'
      ? ['학업', '역량']
      : label === '진로역량'
        ? ['진로', '역량']
        : [label];

  return (
    <text x={x} y={y} textAnchor="middle" fill={T.text} fontSize={15} fontWeight={850} fontFamily={FONT}>
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? 0 : 17}>{line}</tspan>
      ))}
    </text>
  );
}

function CompRadar({ scores, height = 240 }: { scores: SegibuAnalysis['scores']; height?: number }) {
  const data = [
    { subject: '학업역량', value: scores.academic, fullMark: 100 },
    { subject: '진로역량', value: scores.career,   fullMark: 100 },
    { subject: '공동체역량', value: scores.community, fullMark: 100 },
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 28, right: 70, left: 70, bottom: 34 }}>
        <PolarGrid stroke={T.border} />
        <PolarAngleAxis dataKey="subject" tick={<RadarTick />} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="value" stroke={T.primary} fill={T.primary} fillOpacity={0.2} strokeWidth={2.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function HighlightPill({ label, text, color, soft }: { label: string; text: string; color: string; soft: string }) {
  const displayText = text?.trim();
  const missing = !displayText || displayText === '관련 내용 없음';
  return (
    <div style={{ padding: '11px 13px', borderRadius: 8, background: missing ? T.surfaceAlt : soft, borderLeft: `4px solid ${color}`, marginBottom: 8, opacity: missing ? 0.78 : 1 }}>
      <span style={{ fontSize: 12, fontWeight: 850, color: missing ? T.textSubtle : color, letterSpacing: '0.04em', display: 'block', marginBottom: 4, fontFamily: FONT }}>{label}</span>
      <RichText value={missing ? '해당 영역에서는 뚜렷한 근거가 부족합니다.' : displayText} fontSize={14} color={missing ? T.textSubtle : T.textMuted} lineHeight={1.6} />
    </div>
  );
}

function ReadinessCard({ readiness }: { readiness: NonNullable<SegibuAnalysis['admissionsReadiness']> }) {
  const confidenceLabel = readiness.reliability.confidence === 'high' ? '높음' : readiness.reliability.confidence === 'low' ? '낮음' : '보통';

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px', gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text, marginBottom: 8, fontFamily: FONT }}>상담 처방 요약</div>
          <RichText value={readiness.overall} fontSize={16} color={T.textMuted} lineHeight={1.75} />
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
              <div key={`${item.competency}-${index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: '15px 16px', background: T.surfaceAlt, borderTop: `4px solid ${comp.color}` }}>
                <div style={{ fontSize: 12, color: comp.color, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 6, fontFamily: FONT }}>{COMP_LABELS[item.competency]} 보완</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.text, lineHeight: 1.45, marginBottom: 7, fontFamily: FONT }}>{stripPresentationMarkdown(item.issue)}</div>
                <RichText value={item.recommendation} fontSize={14} color={T.textMuted} lineHeight={1.65} />
              </div>
            );
          })}
        </div>
      )}

      {readiness.nextActions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {readiness.nextActions.slice(0, 4).map(action => (
            <div key={`${action.priority}-${action.action}`} style={{ display: 'grid', gridTemplateColumns: '34px 108px 1fr', gap: 11, alignItems: 'start', padding: '12px 14px', borderRadius: 11, background: T.bgAlt }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: T.primary, color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>{action.priority}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: T.primary, fontFamily: FONT }}>{SERVICE_LABELS[action.linkedService]}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 850, color: T.text, lineHeight: 1.5, fontFamily: FONT }}>{stripPresentationMarkdown(action.action)}</div>
                <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.55, fontFamily: FONT }}>{stripPresentationMarkdown(action.reason)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(readiness.reliability.missingData.length > 0 || readiness.reliability.notes) && (
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textSubtle, marginBottom: 4, fontFamily: FONT }}>분석 신뢰도 메모</div>
          {readiness.reliability.missingData.length > 0 && (
            <div style={{ fontSize: 13.5, color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>누락 가능 데이터: {readiness.reliability.missingData.join(', ')}</div>
          )}
          {readiness.reliability.notes && <RichText value={readiness.reliability.notes} fontSize={13.5} color={T.textMuted} lineHeight={1.6} />}
        </div>
      )}
    </div>
  );
}

function PrivacyLockedPanel({ label = '원본 기록' }: { label?: string }) {
  return (
    <div style={{ position: 'relative', minHeight: 132, border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.textSubtle, marginBottom: 10, fontFamily: FONT }}>{label}</div>
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} style={{ height: 12, width: `${90 - idx * 11}%`, borderRadius: 999, background: idx % 2 ? '#DDE3EA' : '#CBD5E1', marginBottom: 10, filter: 'blur(4px)', opacity: 0.35 }} />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, textAlign: 'center', background: 'rgba(248,250,252,0.76)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, border: `1px solid ${T.border}`, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: T.textMuted, fontFamily: FONT }}>LOCK</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: FONT }}>개인정보 보호 잠금</div>
        <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.5, fontFamily: FONT }}>생기부 원문과 원문 인용은 저장·출력하지 않습니다.</div>
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatHtmlBlock(value: string) {
  const safe = escapeHtml((value || '-').replace(/^#{1,6}\s+/gm, ''))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />');
  return `<p>${safe}</p>`;
}

function radarSvgHtml(scores: SegibuAnalysis['scores']) {
  const size = 300;
  const center = 150;
  const radius = 94;
  const axes: { key: keyof SegibuAnalysis['scores']; label: string; angle: number; color: string }[] = [
    { key: 'academic', label: '학업 역량', angle: -90, color: T.comp.academic.color },
    { key: 'career', label: '진로 역량', angle: 30, color: T.comp.career.color },
    { key: 'community', label: '공동체 역량', angle: 150, color: T.comp.community.color },
  ];
  const point = (angle: number, ratio: number) => {
    const rad = (Math.PI / 180) * angle;
    return {
      x: center + Math.cos(rad) * radius * ratio,
      y: center + Math.sin(rad) * radius * ratio,
    };
  };
  const polygon = (ratio: number) => axes.map(axis => {
    const p = point(axis.angle, ratio);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
  const scorePoints = axes.map(axis => {
    const p = point(axis.angle, scores[axis.key] / 100);
    return { ...p, ...axis, score: scores[axis.key] };
  });
  const scorePolygon = scorePoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return `
    <svg class="radar-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="3대 역량 레이더">
      ${[0.25, 0.5, 0.75, 1].map(ratio => `<polygon points="${polygon(ratio)}" fill="none" stroke="#DDE3EA" stroke-width="1" />`).join('')}
      ${axes.map(axis => {
        const p = point(axis.angle, 1);
        return `<line x1="${center}" y1="${center}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#E5E8EB" stroke-width="1" />`;
      }).join('')}
      <polygon points="${scorePolygon}" fill="${T.primary}" fill-opacity="0.20" stroke="${T.primary}" stroke-width="3" />
      ${scorePoints.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="${p.color}" />`).join('')}
      <text x="150" y="28" text-anchor="middle" font-size="14" font-weight="900" fill="${T.text}">학업 역량 ${scores.academic}</text>
      <text x="266" y="206" text-anchor="middle" font-size="14" font-weight="900" fill="${T.text}">진로 역량 ${scores.career}</text>
      <text x="34" y="206" text-anchor="middle" font-size="14" font-weight="900" fill="${T.text}">공동체</text>
      <text x="34" y="223" text-anchor="middle" font-size="14" font-weight="900" fill="${T.text}">역량 ${scores.community}</text>
    </svg>
  `;
}

function scoreCardHtml(label: string, score: number, color: string) {
  return `
    <div class="score-card" style="border-top-color: ${color}">
      <div class="score-label">${escapeHtml(label)}</div>
      <div class="score-row"><strong>${score}</strong><span>/100</span></div>
      <div class="score-track"><span style="width: ${score}%; background: ${color}"></span></div>
    </div>
  `;
}

function readinessHtml(readiness: SegibuAnalysis['admissionsReadiness']) {
  if (!readiness) return '';
  const weaknesses = readiness.criticalWeaknesses.slice(0, 4).map((item) => `
    <div class="weakness">
      <div class="chip">${escapeHtml(COMP_LABELS[item.competency])} 보완</div>
      <strong>${escapeHtml(stripPresentationMarkdown(item.issue))}</strong>
      ${formatHtmlBlock(item.recommendation)}
    </div>
  `).join('');
  const actions = readiness.nextActions.slice(0, 5).map((action) => `
    <li><span class="action-no">${action.priority}</span><div><strong>${escapeHtml(SERVICE_LABELS[action.linkedService])}</strong> ${escapeHtml(stripPresentationMarkdown(action.action))}<br /><em>${escapeHtml(stripPresentationMarkdown(action.reason))}</em></div></li>
  `).join('');

  return `
    <section class="section avoid">
      <h2>상담 처방 요약</h2>
      <div class="readiness-overall">${formatHtmlBlock(readiness.overall)}</div>
      ${weaknesses ? `<div class="weakness-grid">${weaknesses}</div>` : ''}
      ${actions ? `<ol class="actions">${actions}</ol>` : ''}
    </section>
  `;
}

function buildSegibuReportPrintHtml(r: SegibuAnalysis, studentName: string, keywords: { text: string; size: number }[]) {
  const readiness = r.admissionsReadiness;
  const meta = [r.grade, r.targetDept && `목표 학과: ${r.targetDept}`].filter(Boolean).join(' · ');
  const scoreCards = [
    scoreCardHtml('학업역량', r.scores.academic, T.comp.academic.color),
    scoreCardHtml('진로역량', r.scores.career, T.comp.career.color),
    scoreCardHtml('공동체역량', r.scores.community, T.comp.community.color),
  ].join('');
  const radarHtml = radarSvgHtml(r.scores);
  const highlights = (['academic', 'career', 'community'] as const).map((key) => `
    <div class="highlight" style="border-top-color: ${T.comp[key].color}">
      <h3 style="color: ${T.comp[key].color}">${escapeHtml(T.comp[key].label)}</h3>
      ${formatHtmlBlock(r.summaryHighlights[key] || '-')}
    </div>
  `).join('');
  const keywordHtml = keywords.slice(0, 18).map((keyword) => `<span>${escapeHtml(keyword.text)}</span>`).join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(studentName)} 학생부 리포트</title>
  <style>
    @page { size: A4; margin: 14mm; }
    :root {
      --text: #191F28;
      --muted: #4E5968;
      --subtle: #8B95A1;
      --border: #D1D6DB;
      --line: #E5E8EB;
      --primary: #1B64DA;
      --primary-soft: #EBF2FF;
      --bg: #F4F6F8;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.65; }
    .toolbar { max-width: 210mm; margin: 24px auto 12px; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 13px; }
    .toolbar button { height: 36px; padding: 0 14px; border: 1px solid var(--border); border-radius: 8px; background: #fff; color: var(--text); font-weight: 800; cursor: pointer; }
    .sheet { width: 210mm; min-height: 297mm; margin: 0 auto 28px; padding: 14mm; background: #fff; box-shadow: 0 16px 42px rgba(25, 31, 40, 0.12); }
    header { padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid var(--text); break-inside: avoid; page-break-inside: avoid; }
    .eyebrow { color: var(--primary); font-size: 11px; font-weight: 900; margin-bottom: 5px; }
    h1 { margin: 0; font-size: 23px; line-height: 1.25; letter-spacing: 0; }
    .meta { margin-top: 8px; color: var(--muted); font-size: 12.5px; font-weight: 700; }
    .print-radar-section { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); gap: 12px; align-items: stretch; }
    .radar-card { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
    .radar-title { font-size: 12px; font-weight: 900; color: var(--text); margin-bottom: 2px; }
    .radar-svg { width: 100%; height: 66mm; display: block; }
    .score-grid, .highlight-grid, .weakness-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
    .print-radar-section .score-grid { grid-template-columns: 1fr; }
    .score-card, .highlight, .weakness, .strategy-card { border: 1px solid var(--line); border-top: 3px solid var(--primary); border-radius: 8px; padding: 10px 12px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
    .score-label, .chip { font-size: 11px; font-weight: 900; color: var(--muted); margin-bottom: 4px; }
    .score-row { display: flex; align-items: baseline; gap: 4px; }
    .score-row strong { font-size: 27px; line-height: 1; }
    .score-row span { color: var(--subtle); font-size: 11px; }
    .score-track { margin-top: 9px; height: 6px; border-radius: 999px; background: #EEF2F6; overflow: hidden; }
    .score-track span { display: block; height: 100%; border-radius: inherit; }
    .section { margin-top: 18px; }
    .avoid { break-inside: avoid; page-break-inside: avoid; }
    h2 { margin: 0 0 8px; padding-bottom: 6px; border-bottom: 2px solid var(--primary-soft); font-size: 17px; line-height: 1.35; }
    h3 { margin: 0 0 6px; font-size: 13px; }
    p { margin: 0; color: var(--muted); font-size: 12.8px; line-height: 1.7; }
    p + p { margin-top: 8px; }
    strong { color: var(--text); }
    .keywords { display: flex; flex-wrap: wrap; gap: 6px; }
    .keywords span { padding: 4px 8px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 12px; font-weight: 800; }
    .readiness-overall { margin-bottom: 14px; }
    .weakness-grid { margin-top: 14px; }
    .actions { margin: 10px 0 0; padding-left: 0; color: var(--text); font-size: 12.7px; list-style: none; }
    .actions li { display: grid; grid-template-columns: 24px 1fr; gap: 8px; margin-bottom: 7px; break-inside: avoid; page-break-inside: avoid; }
    .action-no { width: 22px; height: 22px; border-radius: 999px; background: var(--primary); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; }
    .actions em { color: var(--muted); font-style: normal; }
    .strategy-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.65fr); gap: 10px; align-items: start; }
    .privacy { margin-top: 18px; padding-top: 10px; border-top: 1px solid var(--line); color: var(--subtle); font-size: 11.5px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>학생부 종합 리포트</div>
    <button onclick="window.print()">인쇄 / PDF 저장</button>
  </div>
  <main class="sheet">
    <header>
      <div class="eyebrow">학생부 종합 리포트</div>
      <h1>${escapeHtml(studentName)} 학생 학생부 리포트</h1>
      ${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ''}
    </header>
    <section class="print-radar-section avoid">
      <div class="radar-card">
        <div class="radar-title">3대 역량 레이더</div>
        ${radarHtml}
      </div>
      <div class="score-grid">${scoreCards}</div>
    </section>
    ${readinessHtml(readiness)}
    <section class="section">
      <h2>3대 역량 핵심 요약</h2>
      <div class="highlight-grid">${highlights}</div>
    </section>
    ${keywordHtml ? `<section class="section avoid"><h2>핵심 키워드</h2><div class="keywords">${keywordHtml}</div></section>` : ''}
    <section class="section avoid">
      <h2>향후 전략 제언</h2>
      <div class="strategy-grid">
        <div class="strategy-card">${formatHtmlBlock(toText(r.futureStrategy.deepDive) || '-')}</div>
        <div class="strategy-card">${formatHtmlBlock(toText(r.futureStrategy.subjects) || '-')}</div>
      </div>
    </section>
    <div class="privacy">생기부 원문, 원문 인용, AI 분석 원문은 저장/출력 파일에서 제외했습니다.</div>
  </main>
</body>
</html>`;
}

export function openSegibuReportPrintWindow(r: SegibuAnalysis, studentName: string, keywords: { text: string; size: number }[] = []) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(buildSegibuReportPrintHtml(r, studentName, keywords));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

// 연도 탭 + 텍스트 + 하이라이트 뷰
function YearTabView({
  hl,
}: {
  hl: { y1: { academic: string; career: string; community: string }; y2: { academic: string; career: string; community: string }; y3: { academic: string; career: string; community: string } };
}) {
  const [year, setYear] = useState<'y1' | 'y2' | 'y3'>('y1');
  const yearLabel = { y1: '1학년', y2: '2학년', y3: '3학년' };
  const h = hl[year];

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

      <PrivacyLockedPanel />
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textSubtle, letterSpacing: '0.06em', margin: '0 0 6px', fontFamily: FONT }}>역량 하이라이트</p>
        <HighlightPill label="학업역량" text={h.academic} color={T.comp.academic.color} soft={T.comp.academic.soft} />
        <HighlightPill label="진로역량" text={h.career}   color={T.comp.career.color}   soft={T.comp.career.soft} />
        <HighlightPill label="공동체역량" text={h.community} color={T.comp.community.color} soft={T.comp.community.soft} />
      </div>
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

  // 키워드: 저장 가능한 상담 요약 텍스트에서만 추출
  const allTexts = [
    r.summaryHighlights.academic, r.summaryHighlights.career, r.summaryHighlights.community,
    toText(r.futureStrategy.deepDive), toText(r.futureStrategy.subjects),
    readiness?.overall,
    ...(readiness?.criticalWeaknesses.flatMap(item => [item.issue, item.recommendation]) ?? []),
  ].filter((text): text is string => Boolean(text));
  const keywords = extractKeywords(allTexts);
  const activeMainTab = embedded ? 'overview' : mainTab;
  const openPrintDocument = () => openSegibuReportPrintWindow(r, resolvedStudentName, keywords);

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px', fontSize: 15, fontWeight: active ? 850 : 650, borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: FONT,
    background: active ? T.primary : 'transparent',
    color: active ? '#fff' : T.textMuted,
    transition: 'all 0.15s',
  });
  const subTabStyle = (active: boolean) => ({
    padding: '7px 14px', fontSize: 14, fontWeight: active ? 850 : 650, borderRadius: 16, border: `1px solid ${active ? T.primary : T.border}`, cursor: 'pointer', fontFamily: FONT,
    background: active ? T.primarySoft : T.surface,
    color: active ? T.primary : T.textMuted,
  });

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 20, background: embedded ? 'transparent' : T.bg }}>

      {/* ── 헤더 ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: embedded ? '22px 24px' : '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ padding: '2px 9px', fontSize: 12, borderRadius: 4, background: T.primarySoft, color: T.primary, fontWeight: 700, fontFamily: FONT }}>학생부 종합 리포트</span>
            {r.targetDept && <span style={{ padding: '2px 9px', fontSize: 12, borderRadius: 4, background: T.bg, color: T.textMuted, fontWeight: 600, fontFamily: FONT }}>목표: {r.targetDept}</span>}
          </div>
          <div style={{ fontSize: embedded ? 24 : 'clamp(24px, 2.2vw, 34px)', fontWeight: 900, color: T.text, letterSpacing: 0, fontFamily: FONT, lineHeight: 1.22 }}>
            {embedded ? '분석 결과를 읽기 쉬운 상담 리포트로 정리했습니다.' : `${resolvedStudentName} 학생 학생부 리포트`}
          </div>
          {!embedded && r.school && <div style={{ fontSize: 15, color: T.textSubtle, marginTop: 5, fontFamily: FONT }}>{r.school}</div>}
        </div>
        {!embedded && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={openPrintDocument} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: T.primary, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: FONT,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 16L6 10h4V3h4v7h4l-6 6z" fill="white"/><path d="M5 20h14" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              인쇄 / PDF 저장
            </button>
          </div>
        )}
      </div>

      {/* ── 메인 탭 ── */}
      {!embedded && (
        <div style={{ display: 'flex', gap: 7, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '7px 9px', flexWrap: 'wrap' }}>
          {([['overview', '종합 현황'], ['changche', '창의적 체험활동'], ['curriculum', '교과 세부능력'], ['behavior', '행동 특성'], ['critical', '비판적 분석']] as const).map(([k, l]) => (
            <button key={k} style={tabStyle(mainTab === k)} onClick={() => setMainTab(k)}>{l}</button>
          ))}
        </div>
      )}

      {/* ── 종합 현황 ── */}
      {activeMainTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18 }}>

          <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 30px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: T.primary, letterSpacing: '0.04em', marginBottom: 4, fontFamily: FONT }}>한눈에 보는 3대 역량</div>
                <h2 style={{ fontSize: 'clamp(24px, 2vw, 32px)', lineHeight: 1.25, margin: 0, color: T.text, fontWeight: 900, fontFamily: FONT }}>레이더와 점수로 먼저 판단합니다</h2>
              </div>
              <div style={{ minWidth: 150, padding: '10px 16px', borderRadius: 12, background: T.primarySoft, border: `1px solid ${T.primaryBorder}`, textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 850, color: T.primary, fontFamily: FONT }}>종합 평균</div>
                <div style={{ fontSize: 42, fontWeight: 950, color: T.primary, lineHeight: 1, fontFamily: FONT }}>{avg3}<span style={{ fontSize: 16, marginLeft: 3 }}>/100</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, alignItems: 'stretch' }}>
              <div style={{ flex: '1 1 560px', minWidth: 0, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 12px 0' }}>
                <CompRadar scores={r.scores} height={embedded ? 390 : 360} />
              </div>

              <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: T.text, fontFamily: FONT }}>역량 점수</div>
                  <div style={{ fontSize: 13, color: T.textSubtle, fontFamily: FONT }}>전국 평균 기준 70점</div>
                </div>
                <ScoreBar label="학업 역량" score={r.scores.academic}  color={T.comp.academic.color}  soft={T.comp.academic.soft} />
                <ScoreBar label="진로 역량" score={r.scores.career}    color={T.comp.career.color}    soft={T.comp.career.soft} />
                <ScoreBar label="공동체 역량" score={r.scores.community} color={T.comp.community.color} soft={T.comp.community.soft} />
              </div>
            </div>
          </section>

          {/* 핵심 키워드 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px 26px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: FONT }}>핵심 키워드</div>
              <div style={{ fontSize: 13, color: T.textSubtle, fontFamily: FONT }}>상담 요약 기반 · 글자 크기 = 빈도</div>
            </div>
            <KeywordCloud words={keywords} />
          </div>

          {readiness && <ReadinessCard readiness={readiness} />}

          {/* 역량 요약 */}
          {(['academic', 'career', 'community'] as const).map(k => (
            <div key={k} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '22px 24px', borderTop: `5px solid ${T.comp[k].color}`, gridColumn: 'span 4' }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: T.comp[k].color, marginBottom: 10, fontFamily: FONT }}>{T.comp[k].label}</div>
              <RichText value={r.summaryHighlights[k]} fontSize={15.5} color={T.textMuted} lineHeight={1.7} />
            </div>
          ))}

          {/* 향후 전략 */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '26px 28px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 16, fontFamily: FONT }}>향후 전략 제언</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: 16 }}>
              <div style={{ padding: '18px 20px', borderRadius: 12, background: T.primarySoft, border: `1px solid ${T.primaryBorder}` }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: T.primary, letterSpacing: '0.04em', marginBottom: 10, fontFamily: FONT }}>심화 탐구 제안</div>
                <RichText value={r.futureStrategy.deepDive} fontSize={16} color={T.textMuted} lineHeight={1.72} />
              </div>
              <div style={{ padding: '18px 20px', borderRadius: 12, background: T.warningSoft, border: `1px solid #FCD89A` }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: T.warning, letterSpacing: '0.04em', marginBottom: 10, fontFamily: FONT }}>연계 추천 과목</div>
                <RichText value={r.futureStrategy.subjects} fontSize={16} color={T.textMuted} lineHeight={1.72} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 창의적 체험활동 ── */}
      {activeMainTab === 'changche' && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {CHANGCHE_TABS.map(({ key, label }) => (
              <button key={key} style={subTabStyle(changcheTab === key)} onClick={() => setChangcheTab(key)}>{label}</button>
            ))}
          </div>
          <YearTabView
            hl={r.highlights.changche[changcheTab]}
          />
        </div>
      )}

      {/* ── 교과 세부능력 ── */}
      {activeMainTab === 'curriculum' && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {CURRICULUM_TABS.map(({ key, label }) => (
              <button key={key} style={subTabStyle(curriculumTab === key)} onClick={() => setCurriculumTab(key)}>{label}</button>
            ))}
          </div>
          <YearTabView
            hl={r.highlights.curriculum[curriculumTab]}
          />
        </div>
      )}

      {/* ── 행동 특성 ── */}
      {activeMainTab === 'behavior' && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 16, fontFamily: FONT }}>행동 특성 및 종합 의견</div>
          <YearTabView
            hl={r.highlights.behavior}
          />
        </div>
      )}

      {/* ── 비판적 분석 ── */}
      {activeMainTab === 'critical' && (
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

          <PrivacyLockedPanel label="AI 분석 원문" />
        </div>
      )}
    </div>
  );
}
