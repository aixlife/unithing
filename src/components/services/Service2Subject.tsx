'use client';

import { useEffect, useState, useMemo, useRef, Fragment } from 'react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import {
  FIELD_DATA, SUBJECT_AREAS, SUBJECT_TYPES, SUNGSHIN_GROUPS, MANDATORY_SUBJECTS,
  type Major, type Field, type SungshinSubject, type SelectionGroup
} from '@/data/curriculumData';
import { UNIVERSITY_TIPS } from '@/data/universityData';
import { SUBJECT_DETAILS } from '@/data/subjectDetails';
import { useStudent } from '@/contexts/StudentContext';
import { getPrimaryTargetPick, getUniversityPicks } from '@/types/student';
import type { SubjectRecommendationPlan, UniversitySubjectRecord } from '@/types/subjects';

const T = {
  primary: '#1B64DA',
  primarySoft: '#EBF2FF',
  primaryBorder: '#CFDFFB',
  success: '#16A34A', successSoft: '#DCFCE7',
  accent: '#F59E0B', accentSoft: '#FEF3C7',
  danger: '#DC2626', dangerSoft: '#FEE2E2',
  bg: '#F4F6F8', bgAlt: '#EFF1F4',
  surface: '#FFFFFF',
  border: '#E5E8EB', borderStrong: '#D1D6DB',
  text: '#191F28', textMuted: '#4E5968', textSubtle: '#8B95A1',
  shadowLg: '0 8px 24px rgba(0,0,0,0.06)',
};
const FONT = "'Pretendard Variable', Pretendard, sans-serif";

// ---- Inline SVG Icons ----
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconSettings = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IconGrad = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IconCheckSquare = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function normalizeSubjectName(name: string) {
  if (!name) return '';
  return name
    .replace(/\s+/g, '')
    .replace(/Ⅰ/g, '1').replace(/Ⅱ/g, '2').replace(/Ⅲ/g, '3')
    .replace(/Ⅳ/g, '4').replace(/Ⅴ/g, '5').replace(/Ⅵ/g, '6')
    .replace(/Ⅶ/g, '7').replace(/Ⅷ/g, '8').replace(/Ⅸ/g, '9').replace(/Ⅹ/g, '10')
    .toLowerCase();
}

function normalizeMajorName(name: string) {
  if (!name) return '';
  return name.replace(/\s+/g, '').replace(/\(.*\)/g, '').replace(/(과|부|전공|계열)$/, '').toLowerCase();
}

function getGradingType(name: string) {
  const n = normalizeSubjectName(name);
  const core = ['문학', '독서와 작문', '대수', '미적분Ⅰ', '영어Ⅰ', '영어Ⅱ'].map(normalizeSubjectName);
  if (core.includes(n)) return '수능 출제/5등급';
  const ach3 = ['운동과 건강', '스포츠 생활1', '스포츠 생활2', '음악 연주와 창작', '미술 창작', '음악 감상과 비평', '미술과 매체', '음악과 미디어', '미술 감상과 비평', '스포츠 문화', '스포츠 문학', '스포츠 과학'].map(normalizeSubjectName);
  if (ach3.includes(n)) return '성취도 3단계';
  if (normalizeSubjectName('기후변화와 환경생태') === n) return '성취도 5단계';
  return '5등급';
}

export function Service2Subject() {
  const { currentStudent, segibuAnalysis } = useStudent();
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'subject' | 'group' | 'plan'>('subject');
  const [planGrade, setPlanGrade] = useState<2 | 3>(2);
  // Custom curriculum
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customGroups, setCustomGroups] = useState<SelectionGroup[]>([]);
  const [customMandatory, setCustomMandatory] = useState<Record<number, SungshinSubject[]>>({});
  const [tempMandatory, setTempMandatory] = useState({ '2-1': '', '2-2': '', '3-1': '', '3-2': '' });
  const [tempGroups, setTempGroups] = useState<{ id: number; grade: number; semester: string; credits: number; selectCount: number; subjects: string }[]>([
    { id: 1, grade: 2, semester: '1학기', credits: 4, selectCount: 1, subjects: '' }
  ]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [univSearchTerm, setUnivSearchTerm] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null);
  const [activeAreaTab, setActiveAreaTab] = useState<string | null>(null);
  const [subjectUniversityQuery, setSubjectUniversityQuery] = useState('');
  const [subjectMajorQuery, setSubjectMajorQuery] = useState('');
  const [subjectMatches, setSubjectMatches] = useState<UniversitySubjectRecord[]>([]);
  const [subjectMatchTotal, setSubjectMatchTotal] = useState(0);
  const [subjectSourceCount, setSubjectSourceCount] = useState<number | null>(null);
  const [subjectSearchLoading, setSubjectSearchLoading] = useState(false);
  const [subjectSearchError, setSubjectSearchError] = useState<string | null>(null);
  const [subjectPlan, setSubjectPlan] = useState<SubjectRecommendationPlan | null>(null);
  const [subjectPlanLoading, setSubjectPlanLoading] = useState(false);
  const [subjectPlanError, setSubjectPlanError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const allMajors = useMemo(() => {
    return FIELD_DATA.flatMap(field => field.majors.map(major => ({ ...major, fieldName: field.name })));
  }, []);

  const studentTargetPick = useMemo(() => {
    return getPrimaryTargetPick(getUniversityPicks(currentStudent?.naesin_data));
  }, [currentStudent?.naesin_data]);

  const studentTargetDept = useMemo(() => {
    return currentStudent?.target_dept || studentTargetPick?.dept || '';
  }, [currentStudent?.target_dept, studentTargetPick]);

  const subjectWeaknesses = useMemo(() => {
    return segibuAnalysis?.admissionsReadiness?.criticalWeaknesses.map((item) => `${item.issue}: ${item.recommendation}`) ?? [];
  }, [segibuAnalysis]);

  const subjectTargetUniversity = useMemo(() => {
    return subjectUniversityQuery.trim() || studentTargetPick?.name || univSearchTerm.trim();
  }, [studentTargetPick?.name, subjectUniversityQuery, univSearchTerm]);

  const subjectTargetMajor = useMemo(() => {
    return subjectMajorQuery.trim() || studentTargetPick?.dept || selectedMajor?.name || studentTargetDept;
  }, [selectedMajor?.name, studentTargetDept, studentTargetPick?.dept, subjectMajorQuery]);

  useEffect(() => {
    if (univSearchTerm.trim() || !studentTargetPick?.name) return;
    const timeoutId = window.setTimeout(() => {
      setUnivSearchTerm(studentTargetPick.name);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [studentTargetPick, univSearchTerm]);

  useEffect(() => {
    if (selectedMajor || searchTerm.trim() || !studentTargetDept) return;

    const timeoutId = window.setTimeout(() => {
      setSearchTerm(studentTargetDept);
      const targetKey = normalizeMajorName(studentTargetDept);
      const matchedField = FIELD_DATA.find(field => field.majors.some(major => normalizeMajorName(major.name) === targetKey));
      const matchedMajor = matchedField?.majors.find(major => normalizeMajorName(major.name) === targetKey);
      if (matchedField && matchedMajor) {
        setSelectedField(matchedField);
        setSelectedMajor(matchedMajor);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, selectedMajor, studentTargetDept]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allMajors.filter(major => major.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, allMajors]);

  const universityTips = useMemo(() => {
    if (!selectedMajor) return [];
    const normalizedMajorName = normalizeMajorName(selectedMajor.name);
    return UNIVERSITY_TIPS.filter(tip => {
      const isMatch = normalizeMajorName(tip.major) === normalizedMajorName;
      if (!isMatch) return false;
      if (univSearchTerm) {
        const search = univSearchTerm.toLowerCase();
        return tip.university.toLowerCase().includes(search) || tip.location.toLowerCase().includes(search) || tip.major.toLowerCase().includes(search);
      }
      return true;
    });
  }, [selectedMajor, univSearchTerm]);

  const subjectsByArea = useMemo(() => {
    if (!selectedMajor) return null;
    const grouped: Record<string, string[]> = {};
    selectedMajor.recommendedSubjects.forEach(subjectName => {
      let areaFound = '기타';
      for (const [area, subjects] of Object.entries(SUBJECT_AREAS)) {
        if (subjects.includes(subjectName)) { areaFound = area; break; }
      }
      if (!grouped[areaFound]) grouped[areaFound] = [];
      grouped[areaFound].push(subjectName);
    });
    return grouped;
  }, [selectedMajor]);

  const areaTabList = useMemo(() => {
    if (!subjectsByArea) return [];
    return Object.keys(subjectsByArea);
  }, [subjectsByArea]);

  const activeArea = useMemo(() => {
    if (!areaTabList.length) return null;
    if (activeAreaTab && areaTabList.includes(activeAreaTab)) return activeAreaTab;
    return areaTabList[0];
  }, [activeAreaTab, areaTabList]);

  const handleFieldSelect = (field: Field) => { setSelectedField(field); setSelectedMajor(null); setSearchTerm(''); };
  const handleMajorSelect = (major: Major) => {
    setSelectedMajor(major);
    setViewMode('subject');
    setActiveAreaTab(null);
    if (!selectedField) {
      const field = FIELD_DATA.find(f => f.majors.some(m => m.name === major.name));
      if (field) setSelectedField(field);
    }
  };
  const resetSelection = () => { setSelectedField(null); setSelectedMajor(null); setSearchTerm(''); };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !selectedMajor || isDownloading) return;
    setIsDownloading(true); setErrorMsg(null);
    try {
      const dataUrl = await toJpeg(printRef.current, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const img = new Image(); img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      const maxW = pdfWidth - margin * 2; const maxH = pdfHeight - margin * 2;
      let fw = maxW; let fh = (img.height * fw) / img.width;
      if (fh > maxH) { fh = maxH; fw = (img.width * fh) / img.height; }
      pdf.addImage(dataUrl, 'JPEG', (pdfWidth - fw) / 2, margin, fw, fh);
      pdf.save(`2022개정_선택과목가이드_${selectedMajor.name}_${planGrade}학년.pdf`);
    } catch {
      setErrorMsg('PDF 생성 실패. 브라우저 인쇄(PDF로 저장)를 이용해 주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const planData = useMemo(() => {
    if (!selectedMajor) return [];
    return SUNGSHIN_GROUPS.filter(g => g.grade === planGrade).map(group => {
      const subjectsWithMetadata = group.subjects.map(subject => {
        const nn = normalizeSubjectName(subject.name);
        const area = Object.keys(SUBJECT_AREAS).find(a => SUBJECT_AREAS[a].some(s => normalizeSubjectName(s) === nn)) || '기타';
        const typeKey = Object.keys(SUBJECT_TYPES).find(k => normalizeSubjectName(k) === nn);
        const type = typeKey ? SUBJECT_TYPES[typeKey] : '일반';
        const isRecommended = selectedMajor.recommendedSubjects.some(s => normalizeSubjectName(s) === nn);
        return { ...subject, area, type, isRecommended, gradingType: getGradingType(subject.name) };
      });
      const groupedByArea: Record<string, typeof subjectsWithMetadata> = {};
      subjectsWithMetadata.forEach(s => {
        if (!groupedByArea[s.area]) groupedByArea[s.area] = [];
        groupedByArea[s.area].push(s);
      });
      return {
        ...group,
        formattedLabel: `${group.id} [택${group.selectCount}] (${group.credits || 4}학점)`,
        groupedSubjects: Object.entries(groupedByArea).map(([area, subjects]) => ({ area, subjects }))
      };
    });
  }, [selectedMajor, planGrade]);

  const processSemester = (raw: string): SungshinSubject[] => {
    return raw.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, semesters: [1, 2] }));
  };

  const handleCustomDone = () => {
    const mandatory: Record<number, SungshinSubject[]> = {
      2: [...processSemester(tempMandatory['2-1']), ...processSemester(tempMandatory['2-2'])],
      3: [...processSemester(tempMandatory['3-1']), ...processSemester(tempMandatory['3-2'])],
    };
    const groups: SelectionGroup[] = tempGroups.map((g, i) => ({
      id: `선택군${i + 1}`,
      grade: g.grade,
      semester: g.semester,
      selectCount: g.selectCount,
      credits: g.credits,
      subjects: g.subjects.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, semesters: [1, 2] })),
      description: '',
    }));
    setCustomMandatory(mandatory);
    setCustomGroups(groups);
    setIsCustomMode(true);
    setShowCustomForm(false);
  };

  const fetchSubjectMatches = async () => {
    setSubjectSearchLoading(true);
    setSubjectSearchError(null);
    setSubjectPlanError(null);
    try {
      const params = new URLSearchParams();
      if (subjectTargetUniversity) params.set('university', subjectTargetUniversity);
      if (subjectTargetMajor) params.set('major', subjectTargetMajor);
      params.set('limit', '12');

      const res = await fetch(`/api/recommended-subjects?${params.toString()}`);
      if (!res.ok) throw new Error('권장과목 검색 실패');
      const data: {
        results: UniversitySubjectRecord[];
        total: number;
        source: { rowCount: number };
      } = await res.json();

      setSubjectMatches(data.results);
      setSubjectMatchTotal(data.total);
      setSubjectSourceCount(data.source.rowCount);
      setSubjectPlan(null);
    } catch {
      setSubjectSearchError('권장과목 데이터를 불러오지 못했습니다.');
    } finally {
      setSubjectSearchLoading(false);
    }
  };

  const fetchSubjectPlan = async () => {
    if (!selectedMajor) return;
    const records = subjectMatches.length > 0 ? subjectMatches : universityTips.map((tip, index) => ({
      id: `curated-${index}`,
      region: '',
      location: tip.location,
      university: tip.university,
      college: '',
      major: tip.major,
      unit: tip.major,
      core: tip.core,
      recommended: tip.recommended,
      coreSubjects: tip.core && tip.core !== '-' ? tip.core.split(',').map(s => s.trim()).filter(Boolean) : [],
      recommendedSubjects: tip.recommended && tip.recommended !== '-' ? tip.recommended.split(',').map(s => s.trim()).filter(Boolean) : [],
      note: tip.note ?? '',
    }));

    setSubjectPlanLoading(true);
    setSubjectPlanError(null);
    try {
      const res = await fetch('/api/recommend/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUniversity: subjectTargetUniversity,
          targetMajor: subjectTargetMajor,
          selectedMajor: selectedMajor.name,
          selectedMajorSubjects: selectedMajor.recommendedSubjects,
          universityRecords: records,
          weaknesses: subjectWeaknesses,
        }),
      });
      if (!res.ok) throw new Error('추천 설계 실패');
      const data: { plan: SubjectRecommendationPlan } = await res.json();
      setSubjectPlan(data.plan);
    } catch {
      setSubjectPlanError('과목 설계를 생성하지 못했습니다.');
    } finally {
      setSubjectPlanLoading(false);
    }
  };

  // ---- RENDER ----
  return (
    <div style={{ fontFamily: FONT, color: T.text }}>

      {/* ===== STEP 1: Major Selection ===== */}
      {!selectedMajor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textSubtle, display: 'flex' }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="학과명 검색 (예: 의예과, 경영학과...)"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value.trim()) setSelectedMajor(null); }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: 42,
                paddingRight: 16,
                paddingTop: 13,
                paddingBottom: 13,
                background: T.surface,
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                fontSize: 15,
                color: T.text,
                outline: 'none',
                fontFamily: FONT,
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
            />
          </div>

          {/* Search results */}
          {searchTerm.trim() ? (
            <div>
              <p style={{ fontSize: 13, color: T.textSubtle, marginBottom: 12 }}>
                검색 결과 <strong style={{ color: T.text }}>{searchResults.length}개</strong>
              </p>
              {searchResults.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {searchResults.map((major) => (
                    <button
                      key={`${major.fieldName}-${major.name}`}
                      onClick={() => handleMajorSelect(major)}
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 14,
                        padding: '14px 16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        fontFamily: FONT,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = T.shadowLg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, marginBottom: 4 }}>{major.fieldName}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{major.name}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center', color: T.textSubtle }}>
                  <div style={{ fontSize: 14 }}>검색 결과가 없습니다.</div>
                  <button onClick={() => setSearchTerm('')} style={{ marginTop: 8, fontSize: 13, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
                    검색어 초기화
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Field filter pills */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setSelectedField(null)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '8px 16px',
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: `1.5px solid ${!selectedField ? T.primary : T.border}`,
                    background: !selectedField ? T.primarySoft : T.surface,
                    color: !selectedField ? T.primary : T.textMuted,
                    fontFamily: FONT,
                    transition: 'all 0.15s',
                  }}
                >
                  전체
                </button>
                {FIELD_DATA.map((field) => (
                  <button
                    key={field.name}
                    onClick={() => handleFieldSelect(field)}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '8px 16px',
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: `1.5px solid ${selectedField?.name === field.name ? T.primary : T.border}`,
                      background: selectedField?.name === field.name ? T.primarySoft : T.surface,
                      color: selectedField?.name === field.name ? T.primary : T.textMuted,
                      fontFamily: FONT,
                      transition: 'all 0.15s',
                    }}
                  >
                    {field.name}
                  </button>
                ))}
              </div>

              {/* Major card grid */}
              {selectedField ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {selectedField.majors.map((major) => (
                    <button
                      key={major.name}
                      onClick={() => handleMajorSelect(major)}
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 14,
                        padding: '16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        fontFamily: FONT,
                        minHeight: 72,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = T.shadowLg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{major.name}</div>
                      <div style={{ fontSize: 12, color: T.textSubtle }}>추천과목 {major.recommendedSubjects.length}개</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {FIELD_DATA.flatMap(field =>
                    field.majors.slice(0, 4).map(major => (
                      <button
                        key={`${field.name}-${major.name}`}
                        onClick={() => handleMajorSelect(major)}
                        style={{
                          background: T.surface,
                          border: `1px solid ${T.border}`,
                          borderRadius: 14,
                          padding: '16px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                          fontFamily: FONT,
                          minHeight: 72,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = T.shadowLg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, marginBottom: 4 }}>{field.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{major.name}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== STEP 2: Subject Recommendation ===== */}
      {selectedMajor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={resetSelection}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: T.textMuted,
                cursor: 'pointer',
                fontFamily: FONT,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderStrong; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}
            >
              <IconArrowLeft />
              돌아가기
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 800, color: T.text, margin: 0 }}>
                {selectedMajor.name} 선택과목 가이드
              </h2>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {/* View toggle */}
              <div style={{ display: 'flex', background: T.bgAlt, borderRadius: 10, padding: 3, gap: 2 }}>
                {([
                  { key: 'subject' as const, icon: <IconLayers />, label: '교과별' },
                  { key: 'group' as const, icon: <IconGrid />, label: '선택군별' },
                  { key: 'plan' as const, icon: <IconCalendar />, label: '계획서' },
                ] as const).map(v => (
                  <button
                    key={v.key}
                    onClick={() => setViewMode(v.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 12px',
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      fontFamily: FONT,
                      background: viewMode === v.key ? T.surface : 'transparent',
                      color: viewMode === v.key ? T.primary : T.textMuted,
                      boxShadow: viewMode === v.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {v.icon}{v.label}
                  </button>
                ))}
              </div>

              {/* Custom curriculum button */}
              {(viewMode === 'group' || viewMode === 'plan') && (
                <button
                  onClick={() => setShowCustomForm(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: isCustomMode ? T.accent : T.surface,
                    color: isCustomMode ? '#fff' : T.textMuted,
                    border: `1px solid ${isCustomMode ? T.accent : T.border}`,
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    transition: 'all 0.15s',
                  }}
                >
                  <IconSettings />
                  {isCustomMode ? '내 교육과정' : '교육과정 입력'}
                </button>
              )}

              {/* PDF button */}
              {viewMode === 'plan' && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: isDownloading ? T.bgAlt : T.primary,
                    color: isDownloading ? T.textSubtle : '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isDownloading ? 'not-allowed' : 'pointer',
                    fontFamily: FONT,
                    transition: 'background 0.15s',
                  }}
                >
                  {isDownloading ? (
                    <span style={{ width: 14, height: 14, border: `2px solid ${T.textSubtle}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  ) : <IconDownload />}
                  {isDownloading ? '생성 중...' : `${planGrade}학년 PDF`}
                </button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: T.dangerSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.danger }}>
              {errorMsg}
            </div>
          )}

          {/* ===== subject view ===== */}
          {viewMode === 'subject' && subjectsByArea && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Left: subject cards (2/3) */}
              <div style={{ flex: '1 1 400px', minWidth: 0 }}>
                {/* Area tabs */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
                  {areaTabList.map((area) => (
                    <button
                      key={area}
                      onClick={() => setActiveAreaTab(area)}
                      style={{
                        whiteSpace: 'nowrap',
                        padding: '7px 14px',
                        borderRadius: 100,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: `1.5px solid ${activeArea === area ? T.primary : T.border}`,
                        background: activeArea === area ? T.primarySoft : T.surface,
                        color: activeArea === area ? T.primary : T.textMuted,
                        fontFamily: FONT,
                        transition: 'all 0.15s',
                      }}
                    >
                      {area} ({(subjectsByArea[area] as string[]).length})
                    </button>
                  ))}
                </div>

                {/* Subject items for active area */}
                {activeArea && subjectsByArea[activeArea] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Section header */}
                    <div style={{
                      background: T.bgAlt,
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{activeArea} 교과군</span>
                      <span style={{ fontSize: 12, color: T.textSubtle }}>{(subjectsByArea[activeArea] as string[]).length}개 과목</span>
                    </div>

                    {(subjectsByArea[activeArea] as string[]).map((subject) => {
                      const type = SUBJECT_TYPES[subject] || '일반';
                      const isSelected = selectedSubjectName === subject;
                      const detail = SUBJECT_DETAILS[subject];

                      const accentColor = type === '진로' ? T.primary : type === '융합' ? '#7C3AED' : T.success;
                      const accentSoft = type === '진로' ? T.primarySoft : type === '융합' ? '#EDE9FE' : T.successSoft;

                      return (
                        <div key={subject}>
                          <button
                            onClick={() => setSelectedSubjectName(isSelected ? null : subject)}
                            style={{
                              width: '100%',
                              background: T.surface,
                              borderTop: `1px solid ${isSelected ? accentColor : T.border}`,
                              borderRight: `1px solid ${isSelected ? accentColor : T.border}`,
                              borderBottom: `1px solid ${isSelected ? accentColor : T.border}`,
                              borderLeft: `3px solid ${accentColor}`,
                              borderRadius: 10,
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              fontFamily: FONT,
                              transition: 'border-color 0.15s',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{subject}</span>
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 100,
                                background: accentSoft,
                                color: accentColor,
                              }}>{type} 선택</span>
                            </div>
                            <span style={{ color: T.textSubtle, display: 'flex', transition: 'transform 0.15s', transform: isSelected ? 'rotate(180deg)' : 'none' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </span>
                          </button>

                          {/* Inline detail */}
                          {isSelected && (
                            <div style={{
                              background: T.bg,
                              border: `1px solid ${T.border}`,
                              borderTop: 'none',
                              borderRadius: '0 0 10px 10px',
                              padding: '14px 16px',
                            }}>
                              {detail ? (
                                <>
                                  <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 12px' }}>{detail.characteristics}</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: T.primarySoft, color: T.primary, fontWeight: 600 }}>교과: {detail.area}</span>
                                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: accentSoft, color: accentColor, fontWeight: 600 }}>유형: {detail.type}</span>
                                    {detail.suneung === '○' && (
                                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: T.accentSoft, color: T.accent, fontWeight: 600 }}>2028 수능 출제</span>
                                    )}
                                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: T.bgAlt, color: T.textMuted, fontWeight: 600 }}>등급: {detail.relativeRank}</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {detail.contents.map((item, idx) => (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: T.textMuted }}>
                                        <span style={{ color: accentColor, marginTop: 2, flexShrink: 0 }}><IconCheck /></span>
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p style={{ fontSize: 13, color: T.textSubtle, margin: 0 }}>과목 정보를 준비 중입니다.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: target university data (1/3) */}
              <div style={{ flex: '0 0 320px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: T.shadowLg,
                }}>
                  <div style={{ background: T.primary, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ color: '#fff', display: 'flex' }}><IconGrad /></span>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>2028 전체 권장과목</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 7 }}>
                      <input
                        type="text"
                        placeholder={subjectTargetUniversity ? `대학: ${subjectTargetUniversity}` : '대학명'}
                        value={subjectUniversityQuery}
                        onChange={(e) => setSubjectUniversityQuery(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid rgba(255,255,255,0.22)',
                          borderRadius: 8,
                          fontSize: 12,
                          color: '#fff',
                          outline: 'none',
                          fontFamily: FONT,
                        }}
                      />
                      <input
                        type="text"
                        placeholder={subjectTargetMajor ? `모집단위: ${subjectTargetMajor}` : '모집단위/학과'}
                        value={subjectMajorQuery}
                        onChange={(e) => setSubjectMajorQuery(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid rgba(255,255,255,0.22)',
                          borderRadius: 8,
                          fontSize: 12,
                          color: '#fff',
                          outline: 'none',
                          fontFamily: FONT,
                        }}
                      />
                    </div>
                    <button
                      onClick={fetchSubjectMatches}
                      disabled={subjectSearchLoading}
                      style={{
                        width: '100%',
                        marginTop: 8,
                        padding: '9px 10px',
                        borderRadius: 8,
                        border: 'none',
                        background: subjectSearchLoading ? 'rgba(255,255,255,0.18)' : '#fff',
                        color: subjectSearchLoading ? 'rgba(255,255,255,0.65)' : T.primary,
                        fontSize: 12,
                        fontWeight: 850,
                        cursor: subjectSearchLoading ? 'not-allowed' : 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      {subjectSearchLoading ? '검색 중...' : '대학 자료 검색'}
                    </button>
                  </div>

                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {subjectSourceCount !== null && (
                      <div style={{ fontSize: 11, color: T.textSubtle, lineHeight: 1.45 }}>
                        전체 {subjectSourceCount.toLocaleString()}건 중 {subjectMatchTotal.toLocaleString()}건 매칭
                      </div>
                    )}
                    {subjectSearchError && (
                      <div style={{ fontSize: 12, color: T.danger, background: T.dangerSoft, borderRadius: 8, padding: '8px 10px' }}>
                        {subjectSearchError}
                      </div>
                    )}
                    {subjectMatches.length === 0 && !subjectSearchError && (
                      <div style={{ fontSize: 12, color: T.textSubtle, lineHeight: 1.55, background: T.bg, borderRadius: 8, padding: '10px 12px' }}>
                        Phase 2에서 고른 목표 대학이 있으면 그 값을 기준으로 검색합니다.
                      </div>
                    )}
                    {subjectMatches.length > 0 && (
                      <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {subjectMatches.map((record) => (
                          <div key={record.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 850, color: T.text }}>{record.university}</div>
                                <div style={{ fontSize: 11, color: T.textSubtle }}>{record.location}{record.college ? ` · ${record.college}` : ''}</div>
                              </div>
                              <span style={{ fontSize: 11, color: T.textSubtle, flexShrink: 0 }}>{record.region}</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: T.textMuted, marginBottom: 7 }}>{record.major}</div>
                            {record.core && (
                              <div style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, marginBottom: 3 }}>핵심과목</div>
                                <div style={{ fontSize: 12, color: T.text, background: T.primarySoft, borderRadius: 6, padding: '5px 8px', lineHeight: 1.5 }}>{record.core}</div>
                              </div>
                            )}
                            {record.recommended && (
                              <div style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: T.textMuted, marginBottom: 3 }}>권장과목</div>
                                <div style={{ fontSize: 12, color: T.textMuted, background: T.bgAlt, borderRadius: 6, padding: '5px 8px', lineHeight: 1.5 }}>{record.recommended}</div>
                              </div>
                            )}
                            {record.note && <div style={{ fontSize: 11, color: T.textSubtle, lineHeight: 1.45 }}>{record.note}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={fetchSubjectPlan}
                      disabled={subjectPlanLoading}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 9,
                        border: `1px solid ${T.primaryBorder}`,
                        background: subjectPlanLoading ? T.bgAlt : T.primarySoft,
                        color: subjectPlanLoading ? T.textSubtle : T.primary,
                        fontSize: 12,
                        fontWeight: 850,
                        cursor: subjectPlanLoading ? 'not-allowed' : 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      {subjectPlanLoading ? '설계 중...' : 'AI 과목 설계'}
                    </button>
                    {subjectPlanError && <div style={{ fontSize: 12, color: T.danger }}>{subjectPlanError}</div>}
                    {subjectPlan && (
                      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>{subjectPlan.summary}</div>
                        {([
                          { label: '2학년', items: subjectPlan.grade2 },
                          { label: '3학년', items: subjectPlan.grade3 },
                        ] as const).map(section => (
                          <div key={section.label}>
                            <div style={{ fontSize: 11, fontWeight: 850, color: T.primary, marginBottom: 5 }}>{section.label}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {section.items.map((item, index) => (
                                <div key={`${section.label}-${item.subject}-${index}`} style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.45 }}>
                                  <strong style={{ color: T.text }}>{item.subject}</strong> — {item.reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {subjectPlan.cautions.length > 0 && (
                          <div style={{ background: T.accentSoft, borderRadius: 8, padding: '8px 10px' }}>
                            {subjectPlan.cautions.slice(0, 3).map((item, index) => (
                              <div key={index} style={{ fontSize: 11, color: '#92400E', lineHeight: 1.45 }}>{item}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {universityTips.length > 0 && (
                  <div style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: T.shadowLg,
                  }}>
                    {/* Header */}
                    <div style={{ background: T.text, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ color: '#fff', display: 'flex' }}><IconGrad /></span>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>대학별 권장과목</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', display: 'flex' }}><IconSearch /></span>
                        <input
                          type="text"
                          placeholder="대학명 검색..."
                          value={univSearchTerm}
                          onChange={(e) => setUnivSearchTerm(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            paddingLeft: 32,
                            paddingRight: 10,
                            paddingTop: 8,
                            paddingBottom: 8,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#fff',
                            outline: 'none',
                            fontFamily: FONT,
                          }}
                        />
                      </div>
                    </div>

                    {/* Tip cards */}
                    <div style={{ maxHeight: 480, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {universityTips.map((tip, idx) => (
                        <div key={idx} style={{
                          background: T.bg,
                          border: `1px solid ${T.border}`,
                          borderRadius: 10,
                          padding: '12px 14px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{tip.university}</span>
                            <span style={{ fontSize: 11, color: T.textSubtle }}>{tip.location}</span>
                          </div>
                          {tip.core && tip.core !== '-' && (
                            <div style={{ marginBottom: 6 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, marginBottom: 3 }}>핵심과목</div>
                              <div style={{ fontSize: 12, color: T.text, background: T.primarySoft, borderRadius: 6, padding: '5px 8px', lineHeight: 1.5 }}>{tip.core}</div>
                            </div>
                          )}
                          {tip.recommended && tip.recommended !== '-' && tip.recommended !== '' && (
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 3 }}>권장과목</div>
                              <div style={{ fontSize: 12, color: T.textMuted, background: T.bgAlt, borderRadius: 6, padding: '5px 8px', lineHeight: 1.5 }}>{tip.recommended}</div>
                            </div>
                          )}
                          {tip.note && tip.note !== '-' && (
                            <div style={{ marginTop: 6, fontSize: 11, color: T.textSubtle, lineHeight: 1.5 }}>{tip.note}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== group view ===== */}
          {viewMode === 'group' && (() => {
            const activeGroups = isCustomMode ? customGroups : SUNGSHIN_GROUPS;
            const activeMandatory = isCustomMode ? customMandatory : MANDATORY_SUBJECTS;
            const grades = [...new Set(activeGroups.map(g => g.grade))].sort();
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {!selectedMajor && (
                  <div style={{ background: T.accentSoft, border: `1px solid ${T.accent}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E' }}>
                    학과를 선택하면 추천 과목이 강조 표시됩니다.
                  </div>
                )}

                {isCustomMode && customGroups.length === 0 && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: T.textSubtle }}>
                    <p style={{ margin: '0 0 12px', fontSize: 14 }}>입력된 교육과정이 없습니다.</p>
                    <button onClick={() => setShowCustomForm(true)} style={{ padding: '8px 16px', background: T.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                      교육과정 입력하기
                    </button>
                  </div>
                )}

                {grades.map(grade => (
                  <div key={grade}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: T.primary, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 13 }}>{grade}학년</span>
                      <span style={{ fontSize: 13, color: T.textSubtle, fontWeight: 500 }}>선택과목 구성</span>
                    </div>

                    {/* Mandatory subjects */}
                    {(activeMandatory[grade] || []).length > 0 && (
                      <div style={{ background: T.primarySoft, border: `1px solid ${T.primaryBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, marginBottom: 8 }}>필수과목</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(activeMandatory[grade] || []).map(s => (
                            <span key={s.name} style={{ fontSize: 13, fontWeight: 600, padding: '4px 10px', background: T.surface, border: `1px solid ${T.primaryBorder}`, borderRadius: 8, color: T.text }}>
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selection groups */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                      {activeGroups.filter(g => g.grade === grade).map(group => (
                        <div key={group.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                          <div style={{ background: T.bg, padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{group.id}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: T.primarySoft, color: T.primary, fontWeight: 700 }}>택{group.selectCount}</span>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: T.bgAlt, color: T.textMuted, fontWeight: 600 }}>{group.credits || 4}학점</span>
                              {group.semester && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: T.bgAlt, color: T.textMuted, fontWeight: 600 }}>{group.semester}</span>}
                            </div>
                          </div>
                          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {group.subjects.map(subject => {
                              const isRec = selectedMajor?.recommendedSubjects.some(s => normalizeSubjectName(s) === normalizeSubjectName(subject.name));
                              const type = SUBJECT_TYPES[subject.name] || '일반';
                              const accentColor = type === '진로' ? T.primary : type === '융합' ? '#7C3AED' : T.success;
                              const accentSoft = type === '진로' ? T.primarySoft : type === '융합' ? '#EDE9FE' : T.successSoft;
                              return (
                                <div key={subject.name} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '7px 10px',
                                  borderRadius: 8,
                                  border: `1px solid ${isRec ? T.primary : T.border}`,
                                  background: isRec ? T.primarySoft : T.surface,
                                  cursor: 'pointer',
                                  transition: 'border-color 0.1s',
                                }}
                                  onClick={() => setSelectedSubjectName(subject.name)}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {isRec && (
                                      <span style={{ color: T.primary, display: 'flex', flexShrink: 0 }}><IconCheck /></span>
                                    )}
                                    <span style={{ fontSize: 13, fontWeight: isRec ? 700 : 500, color: isRec ? T.primary : T.text }}>{subject.name}</span>
                                  </div>
                                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 100, background: accentSoft, color: accentColor, fontWeight: 700, flexShrink: 0 }}>{type}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                {selectedMajor && (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: T.textMuted, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 12, height: 12, background: T.primarySoft, border: `1.5px solid ${T.primary}`, borderRadius: 3 }} />
                      <span>{selectedMajor.name} 추천 과목</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 12, height: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3 }} />
                      <span>일반 과목</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ===== plan view ===== */}
          {viewMode === 'plan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Grade toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', background: T.bgAlt, borderRadius: 10, padding: 3, gap: 2 }}>
                  {([2, 3] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setPlanGrade(g)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        fontFamily: FONT,
                        background: planGrade === g ? T.surface : 'transparent',
                        color: planGrade === g ? T.primary : T.textMuted,
                        boxShadow: planGrade === g ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: T.textSubtle }}>{selectedMajor.name} 전공 권장</span>
              </div>

              {/* Printable area */}
              <div ref={printRef} style={{ background: T.surface }}>
                {/* Print header */}
                <div style={{ background: T.primary, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', display: 'flex' }}><IconCalendar /></span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{planGrade}학년 수강 신청 계획서</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>숭신고등학교 | {selectedMajor.name}</span>
                </div>

                <div style={{ padding: '16px 14px', overflow: 'visible' }}>
                  <table style={{ width: '100%', fontSize: '0.65rem', textAlign: 'left', borderCollapse: 'collapse', border: `1px solid ${T.borderStrong}`, tableLayout: 'fixed' }}>
                    <thead style={{ backgroundColor: T.bg, fontWeight: 'bold', borderBottom: `1px solid ${T.borderStrong}` }}>
                      <tr>
                        <th style={{ padding: '7px 6px', borderRight: `1px solid ${T.border}`, width: '4rem', textAlign: 'center', color: T.textMuted }}>선택방법</th>
                        <th style={{ padding: '7px 6px', borderRight: `1px solid ${T.border}`, width: '5rem', color: T.textMuted }}>교과군</th>
                        <th style={{ padding: '7px 6px', borderRight: `1px solid ${T.border}`, color: T.textMuted }}>과목</th>
                        <th style={{ padding: '7px 6px', borderRight: `1px solid ${T.border}`, width: '4rem', textAlign: 'center', color: T.textMuted }}>구분</th>
                        <th style={{ padding: '7px 6px', borderRight: `1px solid ${T.border}`, width: '2.5rem', textAlign: 'center', color: T.textMuted }}>1학기</th>
                        <th style={{ padding: '7px 6px', borderRight: `1px solid ${T.border}`, width: '2.5rem', textAlign: 'center', color: T.textMuted }}>2학기</th>
                        <th style={{ padding: '7px 6px', borderRight: `1px solid ${T.border}`, width: '5.5rem', textAlign: 'center', color: T.textMuted }}>성적처리</th>
                        <th style={{ padding: '7px 6px', width: '4rem', textAlign: 'center', color: T.textMuted }}>메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((MANDATORY_SUBJECTS[planGrade]) || []).map((subject, idx) => {
                        const nn = normalizeSubjectName(subject.name);
                        const area = Object.keys(SUBJECT_AREAS).find(a => SUBJECT_AREAS[a].some(s => normalizeSubjectName(s) === nn)) || '공통';
                        const typeKey = Object.keys(SUBJECT_TYPES).find(k => normalizeSubjectName(k) === nn);
                        const type = typeKey ? SUBJECT_TYPES[typeKey] : '일반';
                        return (
                          <tr key={`m-${subject.name}`} style={{ backgroundColor: T.primarySoft, borderBottom: `1px solid ${T.border}` }}>
                            {idx === 0 && (
                              <td rowSpan={(MANDATORY_SUBJECTS[planGrade] || []).length}
                                style={{ padding: '5px', borderRight: `1px solid ${T.border}`, fontWeight: 900, textAlign: 'center', fontSize: '0.6rem', color: T.primary, verticalAlign: 'middle' }}>
                                필수
                              </td>
                            )}
                            <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, color: T.textMuted }}>{area}</td>
                            <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, color: T.text, fontWeight: 600 }}>{subject.name}</td>
                            <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center', fontSize: '7px', color: T.textMuted }}>{type} 선택</td>
                            <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center' }}>
                              {subject.semesters.includes(1) && (
                                <div style={{ width: 14, height: 14, border: `1px solid ${T.primary}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: T.primary, margin: '0 auto' }}>
                                  <IconCheckSquare />
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center' }}>
                              {subject.semesters.includes(2) && (
                                <div style={{ width: 14, height: 14, border: `1px solid ${T.primary}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: T.primary, margin: '0 auto' }}>
                                  <IconCheckSquare />
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: '7px' }}>{getGradingType(subject.name)}</td>
                            <td style={{ padding: '5px 6px' }}></td>
                          </tr>
                        );
                      })}

                      {planData.map((group) => (
                        <Fragment key={group.id}>
                          {group.groupedSubjects.map((areaGroup, aIdx) => (
                            areaGroup.subjects.map((subject, sIdx) => {
                              const isLastInGroup = aIdx === group.groupedSubjects.length - 1 && sIdx === areaGroup.subjects.length - 1;
                              return (
                                <tr key={`${group.id}-${subject.name}`} style={{
                                  backgroundColor: subject.isRecommended ? T.primarySoft : T.surface,
                                  borderBottom: isLastInGroup ? `2px solid ${T.borderStrong}` : `1px solid ${T.border}`,
                                  borderTop: (aIdx === 0 && sIdx === 0) ? `2px solid ${T.borderStrong}` : 'none',
                                }}>
                                  {aIdx === 0 && sIdx === 0 && (
                                    <td rowSpan={group.subjects.length} style={{ padding: '5px', borderRight: `1px solid ${T.border}`, fontWeight: 'bold', textAlign: 'center', backgroundColor: T.surface, verticalAlign: 'middle' }}>
                                      <div style={{ fontSize: '0.6rem', fontWeight: 700, lineHeight: 1.3, color: T.textMuted }}>
                                        {group.id}<br />[택{group.selectCount}]<br />({group.credits || 4}학점)
                                      </div>
                                    </td>
                                  )}
                                  {sIdx === 0 && (
                                    <td rowSpan={areaGroup.subjects.length} style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, fontWeight: 500, backgroundColor: T.surface, color: T.textMuted }}>{areaGroup.area}</td>
                                  )}
                                  <td
                                    onClick={() => setSelectedSubjectName(subject.name)}
                                    style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, fontWeight: subject.isRecommended ? 700 : 500, cursor: 'pointer', color: subject.isRecommended ? T.primary : T.text }}
                                  >
                                    {subject.name}
                                  </td>
                                  <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center' }}>
                                    <span style={{ fontSize: '7px', padding: '1px 5px', borderRadius: 9999, fontWeight: 700, backgroundColor: subject.type === '진로' ? T.primarySoft : subject.type === '융합' ? '#EDE9FE' : T.successSoft, color: subject.type === '진로' ? T.primary : subject.type === '융합' ? '#7C3AED' : T.success }}>
                                      {subject.type}
                                    </span>
                                  </td>
                                  <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center' }}>
                                    {subject.semesters.includes(1) && (
                                      <div style={{ width: 14, height: 14, border: `1px solid ${subject.isRecommended ? T.primary : T.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: subject.isRecommended ? T.primary : T.surface, margin: '0 auto' }}>
                                        {subject.isRecommended && <span style={{ color: '#fff' }}><IconCheckSquare /></span>}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center' }}>
                                    {subject.semesters.includes(2) && (
                                      <div style={{ width: 14, height: 14, border: `1px solid ${subject.isRecommended ? T.primary : T.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: subject.isRecommended ? T.primary : T.surface, margin: '0 auto' }}>
                                        {subject.isRecommended && <span style={{ color: '#fff' }}><IconCheckSquare /></span>}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '5px 6px', borderRight: `1px solid ${T.border}`, textAlign: 'center', color: T.textSubtle, fontSize: '7px' }}>{subject.gradingType}</td>
                                  <td style={{ padding: '5px 6px' }}></td>
                                </tr>
                              );
                            })
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Print footer */}
                <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: T.textSubtle, fontStyle: 'italic' }}>
                    * 본 계획서는 전공 적합성을 고려한 추천 안이며, 실제 수강 신청 시 변경될 수 있습니다.
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted }}>제작 : 숭신고등학교 진로진학상담부 김강석</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div style={{
            background: T.primarySoft,
            border: `1px solid ${T.primaryBorder}`,
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{ color: T.primary, flexShrink: 0, marginTop: 1 }}><IconInfo /></span>
            <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', marginBottom: 3 }}>안내 사항</strong>
              <span>위 과목 리스트는 일반적인 권장 사항이며, 실제 학교의 교육과정 편성 현황에 따라 다를 수 있습니다. 대학별 핵심 권장 과목이 다를 수 있으니, 목표 대학의 입학처 홈페이지를 반드시 참고하시기 바랍니다.</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== Custom curriculum modal ===== */}
      {showCustomForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={() => setShowCustomForm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(25,31,40,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'relative',
            background: T.surface,
            width: '100%',
            maxWidth: 640,
            maxHeight: '90vh',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            fontFamily: FONT,
          }}>
            {/* Modal header */}
            <div style={{ background: T.text, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>우리 학교 교육과정 입력</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>과목명을 쉼표로 구분하여 입력하세요</div>
              </div>
              <button onClick={() => setShowCustomForm(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <IconX />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Mandatory subjects */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>필수과목 (학년·학기별)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['2-1', '2-2', '3-1', '3-2'] as const).map(key => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 5 }}>
                        {key.replace('-', '학년 ')}학기
                      </label>
                      <input
                        type="text"
                        value={tempMandatory[key]}
                        onChange={e => setTempMandatory(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="예: 문학, 대수, 영어Ⅰ"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none', color: T.text }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection groups */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>선택군 구성</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tempGroups.map((g, idx) => (
                    <div key={g.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', background: T.bg }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>선택군 {idx + 1}</span>
                        {tempGroups.length > 1 && (
                          <button
                            onClick={() => setTempGroups(prev => prev.filter(x => x.id !== g.id))}
                            style={{ background: T.dangerSoft, border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, fontFamily: FONT }}
                          >
                            <IconTrash />삭제
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px', gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSubtle, marginBottom: 4 }}>학년</label>
                          <select value={g.grade} onChange={e => setTempGroups(prev => prev.map(x => x.id === g.id ? { ...x, grade: parseInt(e.target.value) } : x))}
                            style={{ width: '100%', padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontFamily: FONT, background: T.surface, outline: 'none', color: T.text }}>
                            <option value={2}>2학년</option>
                            <option value={3}>3학년</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSubtle, marginBottom: 4 }}>학기</label>
                          <select value={g.semester} onChange={e => setTempGroups(prev => prev.map(x => x.id === g.id ? { ...x, semester: e.target.value } : x))}
                            style={{ width: '100%', padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontFamily: FONT, background: T.surface, outline: 'none', color: T.text }}>
                            <option>1학기</option>
                            <option>2학기</option>
                            <option>1·2학기</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSubtle, marginBottom: 4 }}>택몇</label>
                          <input type="number" min={1} max={10} value={g.selectCount}
                            onChange={e => setTempGroups(prev => prev.map(x => x.id === g.id ? { ...x, selectCount: parseInt(e.target.value) || 1 } : x))}
                            style={{ width: '100%', padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontFamily: FONT, background: T.surface, outline: 'none', color: T.text }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSubtle, marginBottom: 4 }}>학점</label>
                          <input type="number" min={1} max={8} value={g.credits}
                            onChange={e => setTempGroups(prev => prev.map(x => x.id === g.id ? { ...x, credits: parseInt(e.target.value) || 4 } : x))}
                            style={{ width: '100%', padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontFamily: FONT, background: T.surface, outline: 'none', color: T.text }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSubtle, marginBottom: 4 }}>과목 목록 (쉼표로 구분)</label>
                        <input type="text" value={g.subjects}
                          onChange={e => setTempGroups(prev => prev.map(x => x.id === g.id ? { ...x, subjects: e.target.value } : x))}
                          placeholder="예: 확률과 통계, 미적분, 경제수학"
                          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontFamily: FONT, outline: 'none', color: T.text }} />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setTempGroups(prev => [...prev, { id: Date.now(), grade: 2, semester: '1학기', credits: 4, selectCount: 1, subjects: '' }])}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', border: `1.5px dashed ${T.border}`, borderRadius: 10, background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T.textMuted, fontFamily: FONT }}
                  >
                    <IconPlus />선택군 추가
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.bg, display: 'flex', gap: 8 }}>
              {isCustomMode && (
                <button
                  onClick={() => { setIsCustomMode(false); setShowCustomForm(false); }}
                  style={{ flex: 1, padding: '12px', background: T.surface, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
                >
                  기본 교육과정 복원
                </button>
              )}
              <button
                onClick={handleCustomDone}
                style={{ flex: 2, padding: '12px', background: T.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Subject detail modal ===== */}
      {selectedSubjectName && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedSubjectName(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(25,31,40,0.6)', backdropFilter: 'blur(4px)' }}
          />
          {/* Modal */}
          <div style={{
            position: 'relative',
            background: T.surface,
            width: '100%',
            maxWidth: 560,
            maxHeight: '88vh',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            fontFamily: FONT,
          }}>
            {/* Modal header */}
            <div style={{ background: T.primary, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#fff', display: 'flex' }}><IconBook /></span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{selectedSubjectName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>과목 상세 정보</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubjectName(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >
                <IconX />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {SUBJECT_DETAILS[selectedSubjectName] ? (() => {
                const detail = SUBJECT_DETAILS[selectedSubjectName];
                const type = detail.type;
                const accentColor = type === '진로' ? T.primary : type === '융합' ? '#7C3AED' : T.success;
                const accentSoft = type === '진로' ? T.primarySoft : type === '융합' ? '#EDE9FE' : T.successSoft;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Characteristics */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>과목 특성</div>
                      <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.75, margin: 0, padding: '12px 14px', background: T.bg, borderRadius: 10, borderLeft: `3px solid ${accentColor}` }}>
                        {detail.characteristics}
                      </p>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: T.primarySoft, color: T.primary, fontWeight: 700 }}>교과: {detail.area}</span>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: accentSoft, color: accentColor, fontWeight: 700 }}>유형: {type} 선택</span>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: T.bgAlt, color: T.textMuted, fontWeight: 700 }}>등급: {detail.relativeRank}</span>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: T.bgAlt, color: T.textMuted, fontWeight: 700 }}>성취도: {detail.absoluteAchievement}</span>
                      {detail.suneung === '○' && (
                        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: T.accentSoft, color: T.accent, fontWeight: 700 }}>2028 수능 출제</span>
                      )}
                    </div>

                    {/* Contents */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSubtle, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>주요 내용</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detail.contents.map((item, idx) => (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px',
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: 8,
                          }}>
                            <span style={{ color: accentColor, flexShrink: 0, display: 'flex' }}><IconCheck /></span>
                            <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ padding: '40px 0', textAlign: 'center', color: T.textSubtle }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', opacity: 0.3 }}><IconBook /></div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.textMuted, margin: '0 0 4px' }}>과목 정보를 준비 중입니다.</p>
                  <p style={{ fontSize: 13, color: T.textSubtle, margin: 0 }}>2022 개정 교육과정 기준 상세 내용을 업데이트하고 있습니다.</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
              <button
                onClick={() => setSelectedSubjectName(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: T.text,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = T.text; }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
