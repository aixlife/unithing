'use client';

import { useState, useRef } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary: '#1B64DA',
  primarySoft: '#EBF2FF',
  primaryBorder: '#CFDFFB',
  accent: '#D97706',
  accentSoft: '#FEF3C7',
  success: '#059669',
  successSoft: '#D1FAE5',
  bg: '#F4F6F8',
  bgAlt: '#EFF1F4',
  surface: '#FFFFFF',
  border: '#E5E8EB',
  borderStrong: '#D1D6DB',
  text: '#191F28',
  textMuted: '#4E5968',
  textSubtle: '#8B95A1',
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
type InputTab = 'dept' | 'upload';
type Gyeyeol = '인문/사회' | '자연/이공' | '예체능' | '교육';

interface SubjectCard {
  name: string;
  reason: string;
  type: '필수' | '권장';
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const DEPTS_BY_GYEYEOL: Record<Gyeyeol, string[]> = {
  '인문/사회': ['경영학과', '경제학과', '사회학과', '정치외교학과', '심리학과', '신문방송학과'],
  '자연/이공': ['의예과', '컴퓨터공학과', '전기전자공학과', '화학공학과', '생명과학과', '수학과'],
  '예체능': ['디자인학과', '체육학과', '음악학과', '미술학과', '무용학과', '영화학과'],
  '교육': ['초등교육과', '교육학과', '국어교육과', '수학교육과', '영어교육과', '과학교육과'],
};

const GYEYEOL_LIST: Gyeyeol[] = ['인문/사회', '자연/이공', '예체능', '교육'];

const MOCK_REQUIRED_SUBJECTS: SubjectCard[] = [
  {
    name: '생명과학Ⅱ',
    reason: '의학계열 핵심 기초 — 세포생물학·유전학 내용이 의대 본과 과정과 직결됩니다.',
    type: '필수',
  },
  {
    name: '화학Ⅱ',
    reason: '유기화학·생화학의 기반. 대부분의 의대가 수능/내신에서 필수로 반영합니다.',
    type: '필수',
  },
  {
    name: '미적분',
    reason: '이공계·의학계 수학 필수 트랙. 수능 선택 시 표준점수 유리합니다.',
    type: '필수',
  },
];

const MOCK_RECOMMENDED_SUBJECTS: SubjectCard[] = [
  {
    name: '물리학Ⅱ',
    reason: '의공학·방사선의학 진로 시 강력 권장. 논리적 사고력 훈련에도 효과적입니다.',
    type: '권장',
  },
  {
    name: '확률과 통계',
    reason: '의학통계·임상연구 이해에 필수. 미적분과 병행 수강을 권장합니다.',
    type: '권장',
  },
  {
    name: '심화수학Ⅰ',
    reason: '최상위권 의대 지원자 변별 과목. 수학 실력을 한 단계 끌어올릴 수 있습니다.',
    type: '권장',
  },
];

// ─── Upload icon SVG ──────────────────────────────────────────────────────────
function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill={T.primarySoft}/>
      <path
        d="M20 26V18M20 18l-3 3M20 18l3 3"
        stroke={T.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M13 28h14M13 14h5.5M21.5 14H27"
        stroke={T.primary} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"
      />
    </svg>
  );
}

// ─── Subject result card ──────────────────────────────────────────────────────
function SubjectResultCard({ subject }: { subject: SubjectCard }) {
  const isRequired = subject.type === '필수';
  const stripeColor = isRequired ? T.accent : T.primary;
  const badgeBg = isRequired ? T.accentSoft : T.primarySoft;
  const badgeColor = isRequired ? T.accent : T.primary;

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: T.surface, borderRadius: 12,
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
    }}>
      {/* Left stripe */}
      <div style={{ width: 4, flexShrink: 0, background: stripeColor }} />

      {/* Content */}
      <div style={{
        flex: 1, padding: '14px 16px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {subject.name}
          </div>
          <div style={{ fontSize: 16, color: T.textMuted, lineHeight: 1.5 }}>
            {subject.reason}
          </div>
        </div>
        <div style={{
          flexShrink: 0, padding: '4px 10px', borderRadius: 6,
          background: badgeBg, color: badgeColor,
          fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
          marginTop: 2,
        }}>
          {subject.type}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Service2Subject() {
  const [activeTab, setActiveTab] = useState<InputTab>('dept');
  const [selectedGyeyeol, setSelectedGyeyeol] = useState<Gyeyeol | ''>('');
  const [selectedDept, setSelectedDept] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showResults] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deptOptions = selectedGyeyeol ? DEPTS_BY_GYEYEOL[selectedGyeyeol] : [];

  const handleGyeyeolChange = (value: Gyeyeol | '') => {
    setSelectedGyeyeol(value);
    setSelectedDept('');
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  return (
    <div style={{ fontFamily: FONT, color: T.text, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Input card */}
      <div style={{
        background: T.surface, borderRadius: 16,
        border: `1px solid ${T.border}`, overflow: 'hidden',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${T.border}`,
          background: T.bg,
        }}>
          {([
            { key: 'dept' as InputTab, label: '희망 학과 선택' },
            { key: 'upload' as InputTab, label: '교육과정 업로드' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '14px 0',
                background: activeTab === tab.key ? T.surface : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? `2px solid ${T.primary}` : '2px solid transparent',
                color: activeTab === tab.key ? T.primary : T.textMuted,
                fontSize: 17, fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: 'pointer', fontFamily: FONT,
                transition: 'color 0.12s, border-color 0.12s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: 학과 선택 */}
        {activeTab === 'dept' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 계열·학과 dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {/* 계열 dropdown */}
            <div>
              <label style={{
                display: 'block', fontSize: 15, fontWeight: 600,
                color: T.textSubtle, marginBottom: 6, letterSpacing: '0.04em',
              }}>
                계열
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedGyeyeol}
                  onChange={e => handleGyeyeolChange(e.target.value as Gyeyeol | '')}
                  style={{
                    width: '100%', padding: '11px 36px 11px 14px',
                    fontSize: 17, fontFamily: FONT, fontWeight: 500, color: T.text,
                    background: T.surface, border: `1px solid ${T.borderStrong}`,
                    borderRadius: 10, cursor: 'pointer', appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238B95A1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="">계열을 선택하세요</option>
                  {GYEYEOL_LIST.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 학과 dropdown */}
            <div>
              <label style={{
                display: 'block', fontSize: 15, fontWeight: 600,
                color: T.textSubtle, marginBottom: 6, letterSpacing: '0.04em',
              }}>
                학과
              </label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                disabled={!selectedGyeyeol}
                style={{
                  width: '100%', padding: '11px 36px 11px 14px',
                  fontSize: 14, fontFamily: FONT, fontWeight: 500,
                  color: selectedGyeyeol ? T.text : T.textSubtle,
                  background: selectedGyeyeol ? T.surface : T.bg,
                  border: `1px solid ${T.borderStrong}`,
                  borderRadius: 10,
                  cursor: selectedGyeyeol ? 'pointer' : 'not-allowed',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238B95A1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  opacity: selectedGyeyeol ? 1 : 0.6,
                }}
              >
                <option value="">학과를 선택하세요</option>
                {deptOptions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            </div>{/* end grid */}
          </div>
        )}

        {/* Tab 2: 업로드 */}
        {activeTab === 'upload' && (
          <div style={{ padding: '20px' }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? T.primary : T.borderStrong}`,
                borderRadius: 12, padding: '40px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                background: dragOver ? T.primarySoft : T.bg,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <UploadIcon />
              {uploadedFile ? (
                <>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T.primary }}>
                    {uploadedFile.name}
                  </div>
                  <div style={{ fontSize: 15, color: T.textSubtle }}>
                    클릭하여 다시 업로드
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
                    교육과정 파일을 여기에 드래그하거나 클릭하세요
                  </div>
                  <div style={{ fontSize: 15, color: T.textSubtle, textAlign: 'center', lineHeight: 1.6 }}>
                    PDF, Excel(.xlsx) 파일 지원<br />
                    학교 교육과정 편제표 또는 이수 현황표를 업로드해주세요
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* CTA button */}
        <div style={{ padding: '0 20px 20px' }}>
          <button
            style={{
              width: '100%', padding: '14px 0',
              background: T.primary, color: '#fff',
              fontSize: 15, fontWeight: 700, fontFamily: FONT,
              border: 'none', borderRadius: 10, cursor: 'pointer',
              letterSpacing: '-0.02em',
              transition: 'opacity 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            과목 추천 받기
          </button>
        </div>
      </div>

      {/* Results section */}
      {showResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Results title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', fontFamily: FONT }}>
              의예과 선택과목 추천
            </div>
            <div style={{
              padding: '3px 10px', background: T.primarySoft,
              color: T.primary, fontSize: 15, fontWeight: 600, borderRadius: 6,
            }}>
              2022 개정교육과정
            </div>
          </div>

          {/* 필수 선택 과목 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: T.accent }} />
              <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>필수 선택 과목</span>
              <span style={{ fontSize: 15, color: T.textSubtle }}>반드시 이수해야 하는 과목</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {MOCK_REQUIRED_SUBJECTS.map(subject => (
                <SubjectResultCard key={subject.name} subject={subject} />
              ))}
            </div>
          </div>

          {/* 권장 선택 과목 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: T.primary }} />
              <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>권장 선택 과목</span>
              <span style={{ fontSize: 15, color: T.textSubtle }}>경쟁력 강화를 위해 권장</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {MOCK_RECOMMENDED_SUBJECTS.map(subject => (
                <SubjectResultCard key={subject.name} subject={subject} />
              ))}
            </div>
          </div>

          <p style={{ fontSize: 15, color: T.textSubtle, textAlign: 'center', margin: 0 }}>
            * 추천 과목은 예시이며, 지원 대학의 모집 요강을 반드시 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}
