'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStudent } from '@/contexts/StudentContext';
import { isSegibuAnalysisAllowedEmail } from '@/lib/segibuAccess';
import {
  PresentationText,
  escapeHtml,
  formatPrintHtmlBlock,
  stripPresentationMarkdown,
} from './PresentationText';
import {
  getLatestRoadmapSnapshot,
  getLatestSeteukRecord,
  getNaesinData,
  getPrimaryTargetPick,
  getUniversityPicks,
  TARGET_PICK_SLOTS,
} from '@/types/student';
import type { RoadmapSnapshot, UniversityTargetPick } from '@/types/student';
import type { UniversitySubjectRecord } from '@/types/subjects';

const T = {
  primary: '#1B64DA', primarySoft: '#EBF2FF', primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  warning: '#D97706', warningSoft: '#FEF3C7',
  danger: '#DC2626', dangerSoft: '#FEE2E2',
  bgAlt: '#EFF1F4', surface: '#FFFFFF', surfaceAlt: '#FAFBFC',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
} as const;

const FONT = "'Pretendard Variable', Pretendard, sans-serif";

type RoadmapStatus = {
  label: string;
  done: boolean;
  detail: string;
};

function createSnapshotId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `roadmap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function collectSubjects(records: UniversitySubjectRecord[]) {
  return {
    core: uniq(records.flatMap((record) => record.coreSubjects)).slice(0, 8),
    recommended: uniq(records.flatMap((record) => record.recommendedSubjects)).slice(0, 10),
  };
}

function summarizePick(pick: UniversityTargetPick | undefined) {
  if (!pick) return '아직 저장되지 않음';
  const gap = pick.gradeGap > 0 ? `+${pick.gradeGap.toFixed(2)}` : pick.gradeGap.toFixed(2);
  return `${pick.name} ${pick.dept} / ${pick.process} / 기준 ${pick.grade.toFixed(2)}등급 / 현재 대비 ${gap}`;
}

function buildChecklist(statuses: RoadmapStatus[], hasReadiness: boolean, canUseSegibuAnalysis: boolean) {
  const missing = statuses.filter((item) => !item.done).map((item) => `${item.label} 완료`);
  const base = missing.length > 0 ? missing : [
    '목표 대학별 모집요강 변동 여부 확인',
    '학교 개설 과목과 선택군 충돌 여부 확인',
    '세특 활동 실행 증거와 후속 활동 일정 확인',
  ];
  if (!hasReadiness) {
    return [
      canUseSegibuAnalysis ? '생기부 분석 실행 후 학생부 요약 확인' : '생기부 분석 업데이트 후 학생부 요약 확인',
      ...base,
    ].slice(0, 5);
  }
  return base.slice(0, 5);
}

function buildSnapshot(input: {
  studentName: string;
  targetDept: string;
  analysisSummary: string;
  targetSummary: string;
  subjectSummary: string;
  seteukSummary: string;
  nextChecklist: string[];
}): RoadmapSnapshot {
  return {
    id: createSnapshotId(),
    savedAt: new Date().toISOString(),
    ...input,
  };
}

function buildRoadmapPrintHtml(snapshot: RoadmapSnapshot, statuses: RoadmapStatus[], savedAtLabel: string, studentMeta: string) {
  const statusRows = statuses.map((item) => `
    <div class="status ${item.done ? 'done' : ''}">
      <strong>${escapeHtml(stripPresentationMarkdown(item.label))}</strong>
      <span>${escapeHtml(stripPresentationMarkdown(item.detail))}</span>
    </div>
  `).join('');
  const checklist = snapshot.nextChecklist.map((item, index) => `
    <li><strong>${index + 1}</strong><span>${escapeHtml(stripPresentationMarkdown(item))}</span></li>
  `).join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(snapshot.studentName)} 진학 설계 로드맵</title>
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
      --success: #16A34A;
      --success-soft: #DCFCE7;
      --bg: #F4F6F8;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.65; }
    .toolbar { max-width: 210mm; margin: 24px auto 12px; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 13px; }
    .toolbar button { height: 36px; padding: 0 14px; border: 1px solid var(--border); border-radius: 8px; background: #fff; color: var(--text); font-weight: 800; cursor: pointer; }
    .sheet { width: 210mm; min-height: 297mm; margin: 0 auto 28px; padding: 14mm; background: #fff; box-shadow: 0 16px 42px rgba(25,31,40,0.12); }
    header { border-bottom: 2px solid var(--text); padding-bottom: 13px; margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid; }
    .eyebrow { color: var(--primary); font-size: 11px; font-weight: 900; margin-bottom: 5px; }
    h1 { margin: 0; font-size: 24px; line-height: 1.28; letter-spacing: 0; }
    .meta { margin-top: 8px; color: var(--muted); font-size: 13px; font-weight: 700; }
    .status-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-bottom: 16px; }
    .status { border: 1px solid var(--line); border-radius: 8px; padding: 8px 9px; background: #fff; min-height: 58px; }
    .status.done { background: var(--success-soft); border-color: #86EFAC; }
    .status strong { display: block; font-size: 11.5px; color: var(--text); margin-bottom: 3px; }
    .status span { display: block; font-size: 10.5px; color: var(--muted); line-height: 1.45; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .section { border: 1px solid var(--line); border-radius: 8px; padding: 12px 13px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
    .section.wide { grid-column: 1 / -1; }
    h2 { margin: 0 0 8px; padding-bottom: 6px; border-bottom: 2px solid var(--primary-soft); font-size: 17px; line-height: 1.35; }
    p { margin: 0; color: var(--muted); font-size: 13.2px; line-height: 1.75; }
    p + p { margin-top: 7px; }
    ol { list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 0; margin: 0; }
    li { display: grid; grid-template-columns: 24px 1fr; gap: 8px; padding: 8px 9px; border-radius: 8px; background: #F8FAFC; border: 1px solid var(--line); break-inside: avoid; page-break-inside: avoid; }
    li strong { width: 22px; height: 22px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: var(--primary-soft); color: var(--primary); font-size: 11px; }
    li span { font-size: 12px; color: var(--text); font-weight: 700; line-height: 1.5; }
    footer { margin-top: 14px; padding-top: 9px; border-top: 1px solid var(--line); color: var(--subtle); font-size: 11px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>진학 설계 로드맵</div>
    <button onclick="window.print()">인쇄 / PDF 저장</button>
  </div>
  <main class="sheet">
    <header>
      <div class="eyebrow">진학 설계 로드맵</div>
      <h1>${escapeHtml(snapshot.studentName)} 상담 로드맵</h1>
      <div class="meta">${escapeHtml(studentMeta)} · 목표 학과 ${escapeHtml(snapshot.targetDept || '-')} · 저장 시각 ${escapeHtml(savedAtLabel)}</div>
    </header>
    <section class="status-grid">${statusRows}</section>
    <div class="grid">
      <section class="section wide"><h2>현재 학생부 요약</h2>${formatPrintHtmlBlock(snapshot.analysisSummary)}</section>
      <section class="section"><h2>목표 대학 3 Picks</h2>${formatPrintHtmlBlock(snapshot.targetSummary)}</section>
      <section class="section"><h2>과목 선택안</h2>${formatPrintHtmlBlock(snapshot.subjectSummary)}</section>
      <section class="section wide"><h2>세특 활동안</h2>${formatPrintHtmlBlock(snapshot.seteukSummary)}</section>
      <section class="section wide"><h2>다음 상담 체크리스트</h2><ol>${checklist}</ol></section>
    </div>
    <footer>화면 조작 버튼과 탭은 출력물에서 제외했습니다.</footer>
  </main>
</body>
</html>`;
}

function Section({
  title,
  children,
  action,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <section
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: T.text, fontFamily: FONT, lineHeight: 1.35 }}>{title}</h3>
        {action && <div onClick={(event) => event.stopPropagation()}>{action}</div>}
      </div>
      {children}
    </section>
  );
}

function StatusStrip({ statuses }: { statuses: RoadmapStatus[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
      {statuses.map((item) => (
        <div key={item.label} style={{ border: `1px solid ${item.done ? '#86EFAC' : T.border}`, background: item.done ? T.successSoft : T.surface, borderRadius: 12, padding: '13px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: item.done ? T.success : T.textSubtle, marginBottom: 5, fontFamily: FONT }}>
            {item.done ? '완료' : '필요'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 850, color: T.text, marginBottom: 4, fontFamily: FONT }}>{item.label}</div>
          <div style={{ fontSize: 13.5, color: T.textMuted, lineHeight: 1.5, fontFamily: FONT }}>{stripPresentationMarkdown(item.detail)}</div>
        </div>
      ))}
    </div>
  );
}

function PickList({ picks }: { picks: ReturnType<typeof getUniversityPicks> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {TARGET_PICK_SLOTS.map(({ slot, label }) => {
        const pick = picks[slot];
        return (
          <div key={slot} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 10, alignItems: 'start', padding: '10px 12px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: pick ? T.primary : T.textSubtle, fontFamily: FONT }}>{label}</span>
            <div style={{ fontSize: 14, color: pick ? T.text : T.textSubtle, lineHeight: 1.6, fontFamily: FONT }}>
              {stripPresentationMarkdown(summarizePick(pick))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Service6Roadmap({ onOpenService }: { onOpenService?: (serviceId: number) => void }) {
  const { data: session } = useSession();
  const { currentStudent, segibuAnalysis, updateStudent } = useStudent();
  const [subjectRecords, setSubjectRecords] = useState<UniversitySubjectRecord[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const canUseSegibuAnalysis = isSegibuAnalysisAllowedEmail(session?.user?.email);

  const naesinData = useMemo(() => getNaesinData(currentStudent?.naesin_data), [currentStudent?.naesin_data]);
  const picks = useMemo(() => getUniversityPicks(naesinData), [naesinData]);
  const primaryPick = useMemo(() => getPrimaryTargetPick(picks), [picks]);
  const latestSeteuk = useMemo(() => getLatestSeteukRecord(naesinData), [naesinData]);
  const latestRoadmap = useMemo(() => getLatestRoadmapSnapshot(naesinData), [naesinData]);
  const subjects = useMemo(() => collectSubjects(subjectRecords), [subjectRecords]);
  const readiness = segibuAnalysis?.admissionsReadiness;
  const targetDept = currentStudent?.target_dept || primaryPick?.dept || '';

  useEffect(() => {
    const university = primaryPick?.name ?? '';
    const major = primaryPick?.dept || currentStudent?.target_dept || '';
    if (!university && !major) {
      const timer = window.setTimeout(() => setSubjectRecords([]), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const params = new URLSearchParams();
    if (university) params.set('university', university);
    if (major) params.set('major', major);
    params.set('limit', '8');
    const timer = window.setTimeout(() => {
      setSubjectLoading(true);
      fetch(`/api/recommended-subjects?${params.toString()}`)
        .then(async (res) => {
          if (!res.ok || cancelled) return;
          const data: { results?: UniversitySubjectRecord[] } = await res.json();
          if (!cancelled) setSubjectRecords(data.results ?? []);
        })
        .catch(() => {
          if (!cancelled) setSubjectRecords([]);
        })
        .finally(() => {
          if (!cancelled) setSubjectLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentStudent?.target_dept, primaryPick?.dept, primaryPick?.name]);

  const statuses = useMemo<RoadmapStatus[]>(() => [
    {
      label: '생기부 분석',
      done: Boolean(segibuAnalysis),
      detail: segibuAnalysis
        ? `학업 ${segibuAnalysis.scores.academic} / 진로 ${segibuAnalysis.scores.career} / 공동체 ${segibuAnalysis.scores.community}`
        : canUseSegibuAnalysis ? 'PDF 분석 또는 저장된 분석 필요' : '현재 업데이트중',
    },
    {
      label: '목표 대학',
      done: Object.keys(picks).length > 0,
      detail: primaryPick ? `${primaryPick.name} ${primaryPick.dept}` : '도전/적정/안정 목표 저장 필요',
    },
    {
      label: '과목 설계',
      done: subjects.core.length + subjects.recommended.length > 0,
      detail: subjectLoading ? '권장과목 조회 중' : `핵심 ${subjects.core.length}개 / 권장 ${subjects.recommended.length}개`,
    },
    {
      label: '세특 활동',
      done: Boolean(latestSeteuk),
      detail: latestSeteuk ? latestSeteuk.selectedTopic : '세특 최종 생성 필요',
    },
  ], [canUseSegibuAnalysis, latestSeteuk, picks, primaryPick, segibuAnalysis, subjectLoading, subjects.core.length, subjects.recommended.length]);

  const checklist = useMemo(() => buildChecklist(statuses, Boolean(readiness), canUseSegibuAnalysis), [canUseSegibuAnalysis, readiness, statuses]);

  const snapshot = useMemo(() => buildSnapshot({
    studentName: currentStudent?.name ?? '학생',
    targetDept,
    analysisSummary: readiness?.overall || segibuAnalysis?.summaryHighlights.career || (
      canUseSegibuAnalysis
        ? '생기부 분석을 완료하면 상담 요약이 생성됩니다.'
        : '생기부 분석 업데이트가 끝나면 상담 요약이 생성됩니다.'
    ),
    targetSummary: TARGET_PICK_SLOTS.map(({ label, slot }) => `${label}: ${summarizePick(picks[slot])}`).join('\n'),
    subjectSummary: [
      subjects.core.length > 0 ? `2학년 우선 확인: ${subjects.core.slice(0, 5).join(', ')}` : '',
      subjects.recommended.length > 0 ? `3학년 심화 연결: ${subjects.recommended.slice(0, 6).join(', ')}` : '',
      subjectRecords.length > 0 ? `근거: 2028 권장과목 매칭 ${subjectRecords.length}건` : '목표 대학/학과 저장 후 권장과목을 확인해야 합니다.',
    ].filter(Boolean).join('\n'),
    seteukSummary: latestSeteuk ? `${latestSeteuk.selectedTopic}\n${latestSeteuk.oneLineFeedback}` : '세특 도우미에서 보완 활동을 생성해야 합니다.',
    nextChecklist: checklist,
  }), [canUseSegibuAnalysis, checklist, currentStudent?.name, latestSeteuk, picks, readiness?.overall, segibuAnalysis?.summaryHighlights.career, subjectRecords.length, subjects.core, subjects.recommended, targetDept]);

  const handleSave = async () => {
    if (!currentStudent) return;
    setSaveMessage(null);
    const updated = await updateStudent(currentStudent.id, {
      naesin_data: {
        ...getNaesinData(currentStudent.naesin_data),
        roadmap_latest: snapshot,
      },
    });
    setSaveMessage(updated ? '상담 로드맵 저장 완료' : '상담 로드맵 저장 실패');
  };

  const openPrintDocument = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const savedAtLabel = new Date(snapshot.savedAt).toLocaleString('ko-KR');
    const studentMeta = [currentStudent?.school, currentStudent?.grade].filter(Boolean).join(' · ') || '-';
    printWindow.document.write(buildRoadmapPrintHtml(snapshot, statuses, savedAtLabel, studentMeta));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  if (!currentStudent) {
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 36, textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>학생을 먼저 선택해 주세요.</div>
        <div style={{ fontSize: 14, color: T.textMuted }}>선택된 학생의 분석, 목표 대학, 과목, 세특 결과를 하나의 상담 로드맵으로 묶습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, color: T.text, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 4, background: T.primarySoft, color: T.primary, fontSize: 12, fontWeight: 800, fontFamily: FONT }}>진학 설계 로드맵</span>
            <h2 style={{ margin: '8px 0 4px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: T.text, fontFamily: FONT }}>
              {currentStudent.name} 상담 로드맵
            </h2>
            <div style={{ fontSize: 14, color: T.textMuted, fontFamily: FONT }}>
              {currentStudent.school || '-'} · {currentStudent.grade || '-'} · 목표 학과 {targetDept || '-'}
            </div>
            {latestRoadmap && (
              <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 6, fontFamily: FONT }}>
                마지막 저장: {new Date(latestRoadmap.savedAt).toLocaleString('ko-KR')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} style={{ height: 38, padding: '0 14px', borderRadius: 9, border: `1px solid ${T.primary}`, background: T.primary, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
              로드맵 저장
            </button>
            <button onClick={openPrintDocument} style={{ height: 38, padding: '0 14px', borderRadius: 9, border: `1px solid ${T.borderStrong}`, background: T.surface, color: T.textMuted, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
              인쇄 / PDF 저장
            </button>
          </div>
        </div>

        <StatusStrip statuses={statuses} />

        {saveMessage && (
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 9,
            background: saveMessage.includes('완료') ? T.successSoft : T.dangerSoft,
            color: saveMessage.includes('완료') ? T.success : T.danger,
            border: `1px solid ${saveMessage.includes('완료') ? '#86EFAC' : '#FCA5A5'}`,
            fontSize: 13, fontWeight: 800, fontFamily: FONT,
          }}>
            {saveMessage}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)', gap: 16 }}>
        <Section title="현재 학생부 요약" onClick={() => onOpenService?.(3)} action={<button onClick={() => onOpenService?.(3)} style={linkButtonStyle()}>{canUseSegibuAnalysis ? '분석 열기' : '업데이트중'}</button>}>
          <PresentationText value={snapshot.analysisSummary} fontSize={16} color={T.textMuted} lineHeight={1.75} />
          {readiness?.criticalWeaknesses.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {readiness.criticalWeaknesses.slice(0, 3).map((item, index) => (
                <div key={`${item.competency}-${index}`} style={{ padding: '10px 12px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 15, fontWeight: 850, color: T.text, marginBottom: 5, fontFamily: FONT, lineHeight: 1.45 }}>{stripPresentationMarkdown(item.issue)}</div>
                  <PresentationText value={item.recommendation} fontSize={14.5} color={T.textMuted} lineHeight={1.65} />
                </div>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="목표 대학 3 Picks" onClick={() => onOpenService?.(1)} action={<button onClick={() => onOpenService?.(1)} style={linkButtonStyle()}>대학 찾기</button>}>
          <PickList picks={picks} />
        </Section>

        <Section title="과목 선택안" onClick={() => onOpenService?.(2)} action={<button onClick={() => onOpenService?.(2)} style={linkButtonStyle()}>과목 가이드</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SubjectBlock label="2학년 우선 확인" subjects={subjects.core} fallback="목표 대학/학과 저장 후 핵심과목을 확인합니다." />
            <SubjectBlock label="3학년 심화 연결" subjects={subjects.recommended} fallback="권장과목 데이터가 있으면 심화 과목 후보가 표시됩니다." />
            <div style={{ fontSize: 12.5, color: T.textSubtle, fontFamily: FONT }}>
              {subjectLoading ? '권장과목 조회 중...' : `2028 권장과목 매칭 ${subjectRecords.length}건 기준`}
            </div>
          </div>
        </Section>

        <Section title="세특 활동안" onClick={() => onOpenService?.(4)} action={<button onClick={() => onOpenService?.(4)} style={linkButtonStyle()}>세특 도우미</button>}>
          {latestSeteuk ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 850, color: T.text, lineHeight: 1.45, fontFamily: FONT }}>{stripPresentationMarkdown(latestSeteuk.selectedTopic)}</div>
              <PresentationText value={latestSeteuk.oneLineFeedback} fontSize={14.5} color={T.textMuted} lineHeight={1.7} />
              <div style={{ padding: '10px 12px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 12.5, color: T.textMuted, lineHeight: 1.65, fontFamily: FONT }}>
                <PresentationText value={latestSeteuk.selectedFollowUp || '후속 활동이 저장되지 않았습니다.'} fontSize={14} color={T.textMuted} lineHeight={1.65} />
              </div>
            </div>
          ) : (
            <PresentationText value="세특 도우미에서 최종 결과를 생성하면 이곳에 활동안이 표시됩니다." fontSize={15} color={T.textSubtle} lineHeight={1.7} />
          )}
        </Section>
      </div>

      <Section title="다음 상담 체크리스트">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {checklist.map((item, index) => (
            <div key={`${index}-${item}`} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'start', padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 999, background: T.primarySoft, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, fontFamily: FONT }}>{index + 1}</div>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6, fontWeight: 750, fontFamily: FONT }}>{stripPresentationMarkdown(item)}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SubjectBlock({ label, subjects, fallback }: { label: string; subjects: string[]; fallback: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 850, color: T.textSubtle, marginBottom: 7, fontFamily: FONT }}>{label}</div>
      {subjects.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {subjects.slice(0, 8).map((subject) => (
            <span key={subject} style={{ padding: '6px 9px', borderRadius: 999, background: T.primarySoft, color: T.primary, border: `1px solid ${T.primaryBorder}`, fontSize: 13, fontWeight: 850, fontFamily: FONT }}>
              {subject}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: T.textSubtle, lineHeight: 1.65, fontFamily: FONT }}>{fallback}</div>
      )}
    </div>
  );
}

function linkButtonStyle(): React.CSSProperties {
  return {
    height: 30,
    padding: '0 10px',
    borderRadius: 8,
    border: `1px solid ${T.borderStrong}`,
    background: T.surface,
    color: T.textMuted,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: FONT,
  };
}
