'use client';
import { useState, useRef, useEffect } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { SegibuAnalysis, CompKey } from '@/types/analysis';

const T = {
  primary: '#1B64DA', primaryHover: '#1756BC',
  primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  accent: '#F59E0B', accentSoft: '#FEF3C7',
  danger: '#DC2626', dangerSoft: '#FEE2E2',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  shadowLg: '0 8px 24px rgba(0,0,0,0.06)',
  comp: {
    academic: { color: '#1B64DA', soft: '#EBF2FF', border: '#CFDFFB' },
    career:   { color: '#D97706', soft: '#FEF3C7', border: '#FCD89A' },
    community:{ color: '#059669', soft: '#D1FAE5', border: '#A7F3D0' },
  },
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

// ─── Radar chart ──────────────────────────────────────────────────────────────
function RadarChart({ data, size = 240 }: {
  data: { label: string; value: number; compKey: CompKey }[];
  size?: number;
}) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.36;
  const levels = 5;
  const angles = data.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / data.length);
  const points = data.map((d, i) => {
    const rr = r * (d.value / 100);
    return [cx + rr * Math.cos(angles[i]), cy + rr * Math.sin(angles[i])];
  });
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {[...Array(levels)].map((_, l) => {
        const rr = r * ((l + 1) / levels);
        const pts = angles.map(a => `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`).join(' ');
        return <polygon key={l} points={pts} fill="none" stroke={T.border} strokeWidth="1" />;
      })}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
          stroke={T.border} strokeWidth="1" />
      ))}
      <polygon
        points={points.map(p => p.join(',')).join(' ')}
        fill={T.primary} fillOpacity="0.14"
        stroke={T.primary} strokeWidth="2"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="5"
          fill={T.comp[data[i].compKey].color} stroke={T.surface} strokeWidth="2.5" />
      ))}
      {data.map((d, i) => {
        const lr = r + 32;
        const lx = cx + lr * Math.cos(angles[i]);
        const ly = cy + lr * Math.sin(angles[i]);
        const c = T.comp[d.compKey].color;
        return (
          <g key={i}>
            <text x={lx} y={ly - 6} textAnchor="middle" dominantBaseline="middle"
              fontSize="13" fontWeight="700" fill={c} fontFamily={FONT} letterSpacing="-0.01em">{d.label}</text>
            <text x={lx} y={ly + 10} textAnchor="middle" dominantBaseline="middle"
              fontSize="15" fontWeight="800" fill={T.text} fontFamily={FONT}>{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Word cloud ───────────────────────────────────────────────────────────────
function WordCloud({ words }: { words: { text: string; size: number }[] }) {
  const colors = [T.primary, T.text, T.textMuted, T.primary, T.text, T.textMuted];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', alignItems: 'center', justifyContent: 'center', padding: '24px 10px', minHeight: 180 }}>
      {words.map((w, i) => (
        <span key={i} style={{
          fontSize: w.size, fontWeight: w.size > 22 ? 800 : 600,
          color: colors[i % colors.length],
          letterSpacing: '-0.03em', lineHeight: 1,
          opacity: w.size > 24 ? 1 : 0.75,
          fontFamily: FONT,
        }}>{w.text}</span>
      ))}
    </div>
  );
}

// ─── Competency card ──────────────────────────────────────────────────────────
function CompetencyCard({ title, score, items, compKey }: { title: string; score: number; items: string[]; compKey: CompKey }) {
  const c = T.comp[compKey];
  return (
    <div style={{
      background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
      padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color }} />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
          <div style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', fontWeight: 700, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT }}>{title}</div>
        </div>
        <div style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 800, color: c.color, letterSpacing: '-0.035em', lineHeight: 1, fontFamily: FONT }}>
          {score}<span style={{ fontSize: 12, fontWeight: 600, color: T.textSubtle, marginLeft: 2 }}>/ 100</span>
        </div>
      </div>
      <div style={{ height: 5, background: T.bgAlt, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: c.color, borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: c.color, marginTop: 8, flexShrink: 0, opacity: 0.7 }} />
            <div style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', color: T.textMuted, lineHeight: 1.6, fontFamily: FONT }}>{it}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Star row ─────────────────────────────────────────────────────────────────
function StarRow({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.2l1.76 3.57 3.94.57-2.85 2.78.67 3.92L7 10.2l-3.52 1.85.67-3.92L1.3 5.34l3.94-.57z"
            fill={i < value ? color : 'none'}
            stroke={i < value ? color : T.borderStrong}
            strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

// ─── Competency cell w/ hover tooltip ─────────────────────────────────────────
interface EvalObj { score: number; stars: number; why: string; fix: string }
function CompetencyCell({ evalObj, mode, label, compKey }: {
  evalObj: EvalObj; mode: 'stars' | 'score'; label: string; compKey: CompKey;
}) {
  const [hover, setHover] = useState(false);
  const c = T.comp[compKey];
  return (
    <div style={{ position: 'relative', cursor: 'help' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderRadius: 8,
        background: hover ? c.soft : 'transparent',
        border: `1px solid ${hover ? c.border : 'transparent'}`,
        transition: 'all 0.12s',
      }}>
        {mode === 'stars' ? (
          <StarRow value={evalObj.stars} color={c.color} />
        ) : (
          <>
            <span style={{ fontSize: 15, fontWeight: 800, color: c.color, letterSpacing: '-0.03em', fontFamily: FONT, lineHeight: 1 }}>{evalObj.score}</span>
            <span style={{ fontSize: 10, color: T.textSubtle, fontWeight: 600 }}>/100</span>
          </>
        )}
      </div>

      {hover && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          width: 280, background: T.surface,
          border: `1px solid ${T.borderStrong}`, borderRadius: 12,
          boxShadow: T.shadowLg, padding: 16, zIndex: 50, textAlign: 'left',
          letterSpacing: '-0.01em',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color, borderRadius: '12px 12px 0 0' }} />
          <div style={{ position: 'absolute', top: -6, left: '50%', marginLeft: -6, width: 10, height: 10, background: c.color, transform: 'rotate(45deg)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.01em', fontFamily: FONT }}>{label} 평가</div>
            </div>
            {mode === 'stars' ? (
              <StarRow value={evalObj.stars} color={c.color} />
            ) : (
              <div style={{ fontSize: 16, fontWeight: 800, color: c.color, fontFamily: FONT, letterSpacing: '-0.03em' }}>
                {evalObj.score}<span style={{ fontSize: 10, color: T.textSubtle, fontWeight: 600 }}>/100</span>
              </div>
            )}
          </div>
          <div style={{ padding: 10, borderRadius: 8, background: c.soft, marginBottom: 8, border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.color, letterSpacing: '0.06em', marginBottom: 4 }}>WHY</div>
            <div style={{ fontSize: 15, color: T.text, lineHeight: 1.55, fontFamily: FONT }}>{evalObj.why}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 8, background: T.bgAlt }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', marginBottom: 4 }}>보완할 점</div>
            <div style={{ fontSize: 15, color: T.text, lineHeight: 1.55, fontFamily: FONT }}>{evalObj.fix}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  primary: { bg: T.primarySoft, color: T.primary },
  success: { bg: T.successSoft, color: T.success },
  accent: { bg: T.accentSoft, color: T.accent },
  default: { bg: T.bgAlt, color: T.textMuted },
};

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const v = BADGE_COLORS[tone] ?? BADGE_COLORS.default;
  return (
    <span style={{ display: 'inline-flex', padding: '2px 7px', fontSize: 14, borderRadius: 4, background: v.bg, color: v.color, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: FONT }}>
      {children}
    </span>
  );
}

// ─── Activity eval table ──────────────────────────────────────────────────────
function ActivityEvalTable({ activities, mode, onModeChange }: {
  activities: SegibuAnalysis['activities'];
  mode: 'stars' | 'score';
  onModeChange: (m: 'stars' | 'score') => void;
}) {
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 'clamp(17px, 1.7vw, 22px)', fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: '0 0 4px', fontFamily: FONT }}>활동별 3대 역량 평가</h2>
          <div style={{ fontSize: 15, color: T.textMuted, letterSpacing: '-0.01em', fontFamily: FONT }}>역량 점수에 마우스를 올리면 평가 이유와 보완할 점을 볼 수 있어요</div>
        </div>
        <div style={{ display: 'flex', gap: 3, padding: 3, background: T.bgAlt, borderRadius: 8 }}>
          {(['stars', 'score'] as const).map(k => (
            <button key={k} onClick={() => onModeChange(k)} style={{
              padding: '6px 12px', borderRadius: 6,
              background: mode === k ? T.surface : 'transparent',
              color: mode === k ? T.text : T.textMuted,
              border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: mode === k ? 700 : 500,
              fontFamily: FONT, letterSpacing: '-0.01em',
              boxShadow: mode === k ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>{k === 'stars' ? '별점' : '100점'}</button>
          ))}
        </div>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'visible', minWidth: 700 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 2.4fr 0.9fr 0.9fr 0.9fr',
          padding: '12px 16px', background: T.surfaceAlt,
          borderBottom: `1px solid ${T.border}`, borderRadius: '12px 12px 0 0',
          fontSize: 14, fontWeight: 700, color: T.textMuted, letterSpacing: '-0.01em', alignItems: 'center',
          fontFamily: FONT,
        }}>
          <div>활동명</div><div>유형</div><div>주요 내용</div>
          <div style={{ textAlign: 'center', color: T.comp.academic.color }}>학업역량</div>
          <div style={{ textAlign: 'center', color: T.comp.career.color }}>진로역량</div>
          <div style={{ textAlign: 'center', color: T.comp.community.color }}>공동체역량</div>
        </div>
        {activities.map((a, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 2.4fr 0.9fr 0.9fr 0.9fr',
            padding: '16px', alignItems: 'center',
            borderBottom: i === activities.length - 1 ? 'none' : `1px solid ${T.border}`,
            gap: 8,
          }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.015em', lineHeight: 1.3, fontFamily: FONT }}>{a.name}</div>
              <div style={{ fontSize: 14, color: T.textSubtle, marginTop: 3, letterSpacing: '-0.01em', fontFamily: FONT }}>{a.subject}</div>
            </div>
            <div><Badge tone={a.typeTone}>{a.type}</Badge></div>
            <div style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.55, letterSpacing: '-0.01em', fontFamily: FONT }}>{a.summary}</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CompetencyCell evalObj={a.eval.academic} mode={mode} label="학업역량" compKey="academic" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CompetencyCell evalObj={a.eval.career} mode={mode} label="진로역량" compKey="career" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CompetencyCell evalObj={a.eval.community} mode={mode} label="공동체역량" compKey="community" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: T.bgAlt, fontSize: 14, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em', fontFamily: FONT }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke={T.textSubtle} strokeWidth="1.2"/>
          <path d="M6 3v3.5M6 8.2v0.3" stroke={T.textSubtle} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        평가 기준 · 관찰된 활동의 깊이·지속성·기여도를 3대 역량별로 독립 점수화했어요. 절대평가 기준이에요.
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ANALYSIS_STAGES = [
  { until: 25, label: 'PDF 파일을 읽는 중...' },
  { until: 55, label: 'AI가 활동 내용을 파악하는 중...' },
  { until: 78, label: '3대 역량 점수를 계산하는 중...' },
  { until: 92, label: '최종 리포트를 생성하는 중...' },
  { until: 100, label: '거의 다 됐어요!' },
];

function getStageLabel(progress: number) {
  return ANALYSIS_STAGES.find(s => progress < s.until)?.label ?? '거의 다 됐어요!';
}

export function Service3Segibu() {
  const { segibuAnalysis, analyzeSegibu, analysisLoading, analysisError, currentStudent } = useStudent();
  const [scoreMode, setScoreMode] = useState<'stars' | 'score'>('stars');
  const [yearTab, setYearTab] = useState(2);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!analysisLoading) { setProgress(0); return; }
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 92) return p;
        // 빠르게 시작하다가 점점 느려지는 가속도 커브
        const remaining = 92 - p;
        const step = Math.max(0.2, remaining * 0.025) + Math.random() * 0.4;
        return Math.min(92, p + step);
      });
    }, 350);
    return () => clearInterval(interval);
  }, [analysisLoading]);

  // 로딩 화면
  if (analysisLoading) {
    const stageLabel = getStageLabel(progress);
    return (
      <div style={{ fontFamily: FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '52px 40px', maxWidth: 560, margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="22" stroke={T.border} strokeWidth="4"/>
          <path d="M26 4a22 22 0 0 1 22 22" stroke={T.primary} strokeWidth="4" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 26 26" to="360 26 26" dur="0.75s" repeatCount="indefinite"/>
          </path>
        </svg>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT, marginBottom: 6 }}>
            AI가 생기부를 분석하고 있어요
          </div>
          {file?.name && (
            <div style={{ fontSize: 14, color: T.textMuted, fontFamily: FONT }}>{file.name}</div>
          )}
        </div>

        {/* 프로그레스 바 */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 14, color: T.textMuted, fontFamily: FONT }}>{stageLabel}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.primary, fontFamily: FONT, letterSpacing: '-0.02em' }}>
              {Math.round(progress)}%
            </div>
          </div>
          <div style={{ width: '100%', height: 8, background: T.bgAlt, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: `linear-gradient(90deg, ${T.primary} 0%, #5B9BFF 100%)`,
              borderRadius: 8,
              transition: 'width 0.35s ease-out',
            }} />
          </div>

          {/* 단계 마커 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {ANALYSIS_STAGES.slice(0, -1).map((s, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: progress >= s.until ? T.primary : T.border,
                transition: 'background 0.3s',
                flexShrink: 0,
              }} />
            ))}
          </div>
        </div>

        <div style={{ fontSize: 14, color: T.textSubtle, fontFamily: FONT }}>
          보통 30~60초 정도 걸려요
        </div>
      </div>
    );
  }

  // 업로드 화면
  if (!segibuAnalysis) {
    return (
      <div style={{ fontFamily: FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, maxWidth: 560, margin: '40px auto' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6, fontFamily: FONT }}>생기부 AI 분석</div>
        <div style={{ fontSize: 16, color: T.textMuted, marginBottom: 20 }}>
          {currentStudent ? `${currentStudent.name} 학생의 ` : ''}생기부 PDF를 업로드하면 AI가 종합 분석해드려요.
        </div>
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
          <div style={{ fontSize: 16, fontWeight: 600, color: T.textMuted }}>{file ? file.name : '생기부 PDF를 끌어다 놓거나 클릭해 선택'}</div>
          <div style={{ fontSize: 14, color: T.textSubtle }}>최대 20MB · PDF만 가능</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        {analysisError && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: T.dangerSoft, color: T.danger, fontSize: 14 }}>
            {analysisError}
          </div>
        )}
        <button
          onClick={() => { if (file) analyzeSegibu(file); }}
          disabled={!file || analysisLoading}
          style={{ marginTop: 16, width: '100%', height: 48, borderRadius: 10, background: file && !analysisLoading ? T.primary : T.bgAlt, color: file && !analysisLoading ? '#fff' : T.textSubtle, border: 'none', fontSize: 16, fontWeight: 700, cursor: file && !analysisLoading ? 'pointer' : 'not-allowed', fontFamily: FONT }}
        >
          {analysisLoading ? '⏳ AI 분석 중... (30~60초)' : 'AI 분석 시작'}
        </button>
      </div>
    );
  }

  // 분석 완료 화면
  const radarData: { label: string; value: number; compKey: CompKey }[] = segibuAnalysis.radar.map(r => ({
    label: r.compKey === 'academic' ? '학업역량' : r.compKey === 'career' ? '진로역량' : '공동체역량',
    value: r.value,
    compKey: r.compKey,
  }));

  const STATS = [
    { label: '분석된 세특 과목', value: String(segibuAnalysis.stats.subjectCount), unit: '개', key: 'academic' as CompKey },
    { label: '추출 핵심 키워드', value: String(segibuAnalysis.stats.keywordCount), unit: '개', key: 'career' as CompKey },
    { label: '적정 대학 매칭', value: '분석 중', unit: '', key: 'community' as CompKey },
  ];

  const yearlySubjects = segibuAnalysis.yearlySubjects[String(yearTab + 1) as '1' | '2' | '3'] ?? [];

  const handleReanalyze = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) analyzeSegibu(f);
    };
    input.click();
  };

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8, padding: '0 2px', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Badge tone="primary">생기부 분석</Badge>
            <Badge tone="success">분석 완료</Badge>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.2vw, 44px)', fontWeight: 800, letterSpacing: '-0.035em', color: T.text, margin: 0, lineHeight: 1.2, fontFamily: FONT }}>
            {segibuAnalysis.studentName} 학생의 생기부 리포트
          </h1>
          <div style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', color: T.textMuted, marginTop: 6, letterSpacing: '-0.01em', fontFamily: FONT }}>
            {segibuAnalysis.school} · {segibuAnalysis.grade} · 희망 {segibuAnalysis.targetDept}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {(['PDF 저장', '인쇄'] as const).map((label) => (
            <button key={label} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              background: 'transparent',
              color: T.text,
              border: `1px solid ${T.borderStrong}`,
              fontFamily: FONT, letterSpacing: '-0.01em',
            }}>{label}</button>
          ))}
          <button
            onClick={handleReanalyze}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              background: T.primary,
              color: '#fff',
              border: `1px solid ${T.primary}`,
              fontFamily: FONT, letterSpacing: '-0.01em',
            }}
          >
            다시 분석
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flexShrink: 0 }}>
            <RadarChart data={radarData} size={240} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: T.textMuted, fontWeight: 500, letterSpacing: '-0.01em', fontFamily: FONT }}>3대 역량 종합 점수</div>
            <div style={{ fontSize: 'clamp(48px, 5.5vw, 72px)', fontWeight: 800, letterSpacing: '-0.045em', color: T.primary, lineHeight: 1, marginTop: 6, fontFamily: FONT }}>
              {segibuAnalysis.totalScore}<span style={{ fontSize: 20, color: T.textSubtle, fontWeight: 600, letterSpacing: '-0.02em' }}> / 100</span>
            </div>
            <div style={{ display: 'inline-flex', marginTop: 12, alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: T.successSoft, color: T.success, fontSize: 15, fontWeight: 700, fontFamily: FONT }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 8V2M5 2L2 5M5 2l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {segibuAnalysis.percentile}
            </div>
            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: T.primarySoft, fontSize: 16, color: T.text, lineHeight: 1.65, letterSpacing: '-0.01em', border: `1px solid ${T.primaryBorder}`, fontFamily: FONT }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.primary, letterSpacing: '0.06em', marginBottom: 6 }}>AI 한줄평</div>
              {segibuAnalysis.aiComment}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gap: 10 }}>
          {STATS.map((s) => {
            const cc = T.comp[s.key];
            return (
              <div key={s.key} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cc.color }} />
                <div style={{ fontSize: 17, color: T.textMuted, fontWeight: 500, letterSpacing: '-0.01em', paddingLeft: 10, fontFamily: FONT }}>{s.label}</div>
                <div style={{ fontSize: 'clamp(26px, 2.8vw, 36px)', fontWeight: 800, color: cc.color, letterSpacing: '-0.035em', lineHeight: 1, fontFamily: FONT }}>
                  {s.value}<span style={{ fontSize: 17, color: T.textSubtle, marginLeft: 3, fontWeight: 600 }}>{s.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competency cards */}
      <div>
        <h2 style={{ fontSize: 'clamp(17px, 1.7vw, 22px)', fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: '0 0 12px 2px', fontFamily: FONT }}>역량별 상세 분석</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {segibuAnalysis.competencies.map((comp) => (
            <CompetencyCard
              key={comp.compKey}
              title={comp.title}
              score={comp.score}
              compKey={comp.compKey}
              items={comp.items}
            />
          ))}
        </div>
      </div>

      {/* Activity eval table */}
      <ActivityEvalTable activities={segibuAnalysis.activities} mode={scoreMode} onModeChange={setScoreMode} />

      {/* Year tabs + subjects */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 'clamp(17px, 1.7vw, 22px)', fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0, fontFamily: FONT }}>학년별 세특 흐름</h2>
          <div style={{ display: 'flex', gap: 4, padding: 3, background: T.bgAlt, borderRadius: 8 }}>
            {['1학년', '2학년', '3학년'].map((y, i) => (
              <button key={i} onClick={() => setYearTab(i)} style={{
                padding: '6px 14px', borderRadius: 6,
                background: i === yearTab ? T.surface : 'transparent',
                color: i === yearTab ? T.text : T.textMuted,
                border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: i === yearTab ? 700 : 500, fontFamily: FONT, letterSpacing: '-0.01em',
                boxShadow: i === yearTab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}>{y}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {yearlySubjects.map((s, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.01em', fontFamily: FONT }}>{s.name}</div>
                <span style={{ padding: '2px 7px', fontSize: 14, borderRadius: 4, background: s.score.includes('+') ? T.primarySoft : T.bgAlt, color: s.score.includes('+') ? T.primary : T.textMuted, fontWeight: 600, fontFamily: FONT }}>{s.score}</span>
              </div>
              <div style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.55, fontFamily: FONT }}>{s.keyword}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Word cloud */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 'clamp(17px, 1.7vw, 22px)', fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0, fontFamily: FONT }}>핵심 키워드</h2>
          <div style={{ fontSize: 15, color: T.textMuted, fontFamily: FONT }}>3년간 생기부에서 추출</div>
        </div>
        <WordCloud words={segibuAnalysis.words} />
      </div>
    </div>
  );
}
