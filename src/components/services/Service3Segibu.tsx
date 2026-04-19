'use client';
import { useState } from 'react';

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

type CompKey = 'academic' | 'career' | 'community';
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
const WORDS = [
  { text: '탐구', size: 34 }, { text: '생명과학', size: 30 },
  { text: '자기주도', size: 26 }, { text: '리더십', size: 22 },
  { text: '협업', size: 24 }, { text: '의학', size: 32 },
  { text: '윤리', size: 18 }, { text: '독서', size: 20 },
  { text: '논리적사고', size: 22 }, { text: '실험설계', size: 19 },
  { text: '봉사', size: 17 }, { text: '창의성', size: 24 },
  { text: '발표', size: 16 }, { text: '분석력', size: 21 },
  { text: 'DNA', size: 18 }, { text: '끈기', size: 15 },
];

function WordCloud() {
  const colors = [T.primary, T.text, T.textMuted, T.primary, T.text, T.textMuted];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', alignItems: 'center', justifyContent: 'center', padding: '24px 10px', minHeight: 180 }}>
      {WORDS.map((w, i) => (
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

// ─── Activity data ────────────────────────────────────────────────────────────
const ACTIVITIES = [
  {
    name: 'mRNA 백신 심화탐구', type: '세특', typeTone: 'primary', subject: '생명과학Ⅱ',
    summary: '화이자·모더나 논문 2편 원문 독해 후, LNP 전달시스템과 국내 제약산업 특허 분석 보고서 작성',
    eval: {
      academic: { score: 95, stars: 5, why: '논문 원문 독해 + 특허 데이터 분석까지 확장된 깊이 있는 자기주도 탐구예요.', fix: '탐구 결과를 도표·그래프로 시각화하면 완성도가 올라가요.' },
      career:   { score: 92, stars: 5, why: '의예과 지망 학생에게 가장 이상적인 주제·방법론 조합이에요.', fix: '국내 제약산업 관계자 인터뷰 1건을 추가하면 진로 탐색 폭이 넓어져요.' },
      community:{ score: 72, stars: 4, why: '동아리 세미나 발표로 지식을 공유한 부분이 긍정적이에요.', fix: '후배 대상 스터디 개설 등 협업 흔적이 남는 활동을 연계해보세요.' },
    },
  },
  {
    name: '지역아동센터 학습 봉사', type: '봉사', typeTone: 'success', subject: '진로활동',
    summary: '3년간 주 1회 초등 수학·과학 학습 지도 · 누적 120시간 · 개별 학습계획표 직접 설계',
    eval: {
      academic: { score: 68, stars: 3, why: '교과 지식을 쉽게 재구성해 가르친 경험이 학업 이해도를 드러내요.', fix: '학습지 설계 과정을 세특에 연결하면 학업역량에 더 기여해요.' },
      career:   { score: 74, stars: 4, why: '의료·보건 진로와는 결이 다르지만, 사람을 돕는 진로 동기로 해석 가능해요.', fix: '다음에는 지역 병원 건강교실 같은 의료 맥락 봉사로 전환을 권장해요.' },
      community:{ score: 94, stars: 5, why: '3년 지속 + 누적 120시간은 공동체역량 최상위 지표예요.', fix: '봉사 결과를 정리한 회고록 1편을 남기면 서사가 강해져요.' },
    },
  },
  {
    name: '과학 동아리 부장 (BIOLAB)', type: '동아리', typeTone: 'accent', subject: '자율활동',
    summary: '2년차 부장 · 연간 탐구 주제 6건 기획 · 신입 부원 멘토링 제도 도입 · 과학축제 부스 운영 주관',
    eval: {
      academic: { score: 80, stars: 4, why: '탐구 주제 6건 기획이 학업적 사고의 폭을 잘 보여줘요.', fix: '기획한 주제 중 1건을 본인이 끝까지 주도한 기록이 있으면 좋겠어요.' },
      career:   { score: 86, stars: 4, why: '의예과 관련 주제로 동아리를 이끈 점이 진로 주도성을 명확히 드러내요.', fix: '병원·대학 연구실과 연계한 외부 특강 1회를 조직해보세요.' },
      community:{ score: 90, stars: 5, why: '멘토링 제도 도입은 구성원을 살피는 리더십의 전형이에요.', fix: '제도 도입 후 성과(참여율·후기)를 수치로 남기면 증빙이 강해져요.' },
    },
  },
  {
    name: '의료윤리 독서 감상문', type: '독서', typeTone: 'default', subject: '진로활동',
    summary: '「의사와 수의사가 만나다」 독후 감상문 · 1학년 2학기 기록 · 이후 관련 독서 기록 없음',
    eval: {
      academic: { score: 55, stars: 3, why: '독서 기록이 짧고 감상 중심이라 학업적 분석은 부족해요.', fix: '책 속 쟁점 1개를 골라 비판적 에세이로 확장해보세요.' },
      career:   { score: 60, stars: 3, why: '의료윤리 주제 자체는 진로 적합도가 높지만, 1학년 1회로 그쳐 아쉬워요.', fix: '2~3권 추가 독서로 3년간의 연속성을 만들어주세요.' },
      community:{ score: 48, stars: 2, why: '개인 독서 활동이라 공동체 맥락이 드러나지 않아요.', fix: '독서 토론회·북클럽에서 발표 경험으로 확장해보세요.' },
    },
  },
  {
    name: '교내 모의 UN · 보건분과', type: '자율', typeTone: 'primary', subject: '자율활동',
    summary: 'WHO 대표단 역할 · 백신 불평등 의제 결의안 공동 발의 · 2학년 1학기',
    eval: {
      academic: { score: 78, stars: 4, why: '국제 보건 이슈를 자료 기반으로 정리한 점이 학업적으로 가치 있어요.', fix: '결의안 근거 자료의 출처·통계를 더 정교하게 인용해주세요.' },
      career:   { score: 82, stars: 4, why: '백신 심화탐구와 주제가 자연스럽게 이어져 진로 일관성을 보완해줘요.', fix: '이 경험을 다음 탐구의 문제의식으로 연결한 흔적을 남겨보세요.' },
      community:{ score: 85, stars: 4, why: '공동 발의 과정에서 협상·설득 역량이 드러난 점이 좋아요.', fix: '분과 내에서 본인이 해결한 구체적 갈등 에피소드 1건을 기록해두세요.' },
    },
  },
];

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
function ActivityEvalTable({ mode, onModeChange }: { mode: 'stars' | 'score'; onModeChange: (m: 'stars' | 'score') => void }) {
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
        {ACTIVITIES.map((a, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 2.4fr 0.9fr 0.9fr 0.9fr',
            padding: '16px', alignItems: 'center',
            borderBottom: i === ACTIVITIES.length - 1 ? 'none' : `1px solid ${T.border}`,
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
const SUBJECTS = [
  { name: '통합과학', score: 'A', keyword: '생명과학 심화탐구 주도' },
  { name: '수학Ⅱ', score: 'A', keyword: '미적분 응용, 문제풀이 전략' },
  { name: '생명과학Ⅰ', score: 'A+', keyword: 'DNA 복제 메커니즘 발표' },
  { name: '화학Ⅰ', score: 'A', keyword: '완충용액 실험 설계' },
  { name: '영어Ⅱ', score: 'B+', keyword: '의학 논문 원문 읽기 동아리' },
  { name: '한국사', score: 'A', keyword: '근현대 의료사 리포트' },
];

export function Service3Segibu() {
  const [scoreMode, setScoreMode] = useState<'stars' | 'score'>('stars');
  const [yearTab, setYearTab] = useState(2);

  const radarData: { label: string; value: number; compKey: CompKey }[] = [
    { label: '학업역량', value: 88, compKey: 'academic' },
    { label: '진로역량', value: 76, compKey: 'career' },
    { label: '공동체역량', value: 82, compKey: 'community' },
  ];

  const STATS = [
    { label: '분석된 세특 과목', value: '18', unit: '개', key: 'academic' as CompKey },
    { label: '추출 핵심 키워드', value: '127', unit: '개', key: 'career' as CompKey },
    { label: '적정 대학 매칭', value: '24', unit: '곳', key: 'community' as CompKey },
  ];

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
            김지우 학생의 생기부 리포트
          </h1>
          <div style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', color: T.textMuted, marginTop: 6, letterSpacing: '-0.01em', fontFamily: FONT }}>
            서울대치고등학교 · 고3 · 희망 의예과·생명공학과 · 분석일 2026.04.17 14:32
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {(['PDF 저장', '인쇄', '다시 분석'] as const).map((label, i) => (
            <button key={label} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              background: i === 2 ? T.primary : 'transparent',
              color: i === 2 ? '#fff' : T.text,
              border: `1px solid ${i === 2 ? T.primary : T.borderStrong}`,
              fontFamily: FONT, letterSpacing: '-0.01em',
            }}>{label}</button>
          ))}
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
              82<span style={{ fontSize: 20, color: T.textSubtle, fontWeight: 600, letterSpacing: '-0.02em' }}> / 100</span>
            </div>
            <div style={{ display: 'inline-flex', marginTop: 12, alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: T.successSoft, color: T.success, fontSize: 15, fontWeight: 700, fontFamily: FONT }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 8V2M5 2L2 5M5 2l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              상위 18% · 지난 분석 대비 +4점
            </div>
            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: T.primarySoft, fontSize: 16, color: T.text, lineHeight: 1.65, letterSpacing: '-0.01em', border: `1px solid ${T.primaryBorder}`, fontFamily: FONT }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.primary, letterSpacing: '0.06em', marginBottom: 6 }}>AI 한줄평</div>
              학업역량과 공동체역량이 고르게 높고, 생명과학 탐구의 일관성이 돋보입니다. 진로역량에서 의료윤리 관련 독서 활동을 보강하면 리포트의 완성도가 더 올라갈 것으로 예상돼요.
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
          <CompetencyCard title="학업역량" score={88} compKey="academic" items={['이과 전 과목 내신 1.4등급 유지, 꾸준한 학업 성취', '생명과학 심화탐구 2건에서 실험 설계 주도', '수학 탐구 보고서의 논리 전개가 명확함']} />
          <CompetencyCard title="진로역량" score={76} compKey="career" items={['의예과 관련 교내 동아리 2년 지속 활동', '의료윤리 주제 독서활동이 1학년에 집중됨', '병원 견학 연계 진로 탐구 확장 권장']} />
          <CompetencyCard title="공동체역량" score={82} compKey="community" items={['학급 부반장, 과학동아리 부장 경험', '지역아동센터 봉사 120시간 (3년 누적)', '팀 프로젝트에서 조율자 역할 반복 등장']} />
        </div>
      </div>

      {/* Activity eval table */}
      <ActivityEvalTable mode={scoreMode} onModeChange={setScoreMode} />

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
          {SUBJECTS.map((s, i) => (
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
        <WordCloud />
      </div>
    </div>
  );
}
