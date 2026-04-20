'use client';

import { useState, useMemo, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import {
  BookOpen,
  GraduationCap,
  Search,
  ChevronRight,
  Info,
  CheckCircle2,
  LayoutGrid,
  ListFilter,
  Calendar,
  Layers,
  FileText,
  CheckSquare,
  Download,
  Plus,
  X,
  Save,
  Trash2,
  Settings
} from 'lucide-react';
import {
  FIELD_DATA, SUBJECT_AREAS, SUBJECT_TYPES, SUNGSHIN_GROUPS, MANDATORY_SUBJECTS,
  type Major, type Field, type SelectionGroup, type SungshinSubject
} from '@/data/curriculumData';
import { UNIVERSITY_TIPS } from '@/data/universityData';
import { SUBJECT_DETAILS } from '@/data/subjectDetails';

export function Service2Subject() {
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'subject' | 'group' | 'plan'>('subject');
  const [planGrade, setPlanGrade] = useState<2 | 3>(2);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customGroups, setCustomGroups] = useState<SelectionGroup[]>([]);
  const [customMandatory, setCustomMandatory] = useState<Record<number, SungshinSubject[]>>({});
  const [tempMandatory, setTempMandatory] = useState({ '2-1': '', '2-2': '', '3-1': '', '3-2': '' });
  const [tempGroups, setTempGroups] = useState<any[]>([
    { id: Date.now(), grade: 2, semester: '1학기', credits: 4, selectCount: 1, subjects: '' }
  ]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [univSearchTerm, setUnivSearchTerm] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const normalizeSubjectName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/\s+/g, '')
      .replace(/Ⅰ/g, '1').replace(/Ⅱ/g, '2').replace(/Ⅲ/g, '3')
      .replace(/Ⅳ/g, '4').replace(/Ⅴ/g, '5').replace(/Ⅵ/g, '6')
      .replace(/Ⅶ/g, '7').replace(/Ⅷ/g, '8').replace(/Ⅸ/g, '9').replace(/Ⅹ/g, '10')
      .toLowerCase();
  };

  const handleAddGroup = () => {
    setTempGroups([...tempGroups, { id: Date.now(), grade: 2, semester: '1학기', credits: 4, selectCount: 1, subjects: '' }]);
  };

  const handleRemoveGroup = (id: number) => {
    setTempGroups(tempGroups.filter(g => g.id !== id));
  };

  const handleUpdateGroup = (id: number, field: string, value: any) => {
    setTempGroups(tempGroups.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleDone = () => {
    const newMandatory: Record<number, SungshinSubject[]> = { 2: [], 3: [] };
    const processSemester = (grade: number, semester: number, input: string) => {
      const subjects = input.split(',').map(s => s.trim()).filter(s => s !== '');
      subjects.forEach(name => {
        const existing = newMandatory[grade].find(s => s.name === name);
        if (existing) {
          if (!existing.semesters.includes(semester)) { existing.semesters.push(semester); existing.semesters.sort(); }
        } else {
          newMandatory[grade].push({ name, semesters: [semester] });
        }
      });
    };
    processSemester(2, 1, tempMandatory['2-1']);
    processSemester(2, 2, tempMandatory['2-2']);
    processSemester(3, 1, tempMandatory['3-1']);
    processSemester(3, 2, tempMandatory['3-2']);
    setCustomMandatory(newMandatory);
    const newGroups: SelectionGroup[] = tempGroups.map((g, idx) => ({
      id: `선택군${idx + 1}`,
      grade: g.grade,
      semester: g.semester,
      selectCount: g.selectCount,
      credits: g.credits,
      description: `${g.grade}학년 ${g.semester} 선택과목군 ${idx + 1} (택${g.selectCount})`,
      subjects: g.subjects.split(',').map((s: string) => ({
        name: s.trim(),
        semesters: g.semester === '1학기' ? [1] : [2]
      })).filter((s: any) => s.name !== '')
    }));
    setCustomGroups(newGroups);
    setIsCustomMode(true);
    setShowCustomForm(false);
  };

  const allMajors = useMemo(() => {
    return FIELD_DATA.flatMap(field => field.majors.map(major => ({ ...major, fieldName: field.name })));
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allMajors.filter(major => major.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, allMajors]);

  const normalizeMajorName = (name: string) => {
    if (!name) return '';
    return name.replace(/\s+/g, '').replace(/\(.*\)/g, '').replace(/(과|부|전공|계열)$/, '').toLowerCase();
  };

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

  const handleFieldSelect = (field: Field) => { setSelectedField(field); setSelectedMajor(null); setSearchTerm(''); };
  const handleMajorSelect = (major: Major) => {
    setSelectedMajor(major);
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
    } catch (error: any) {
      setErrorMsg('PDF 생성 실패. 브라우저 인쇄(PDF로 저장)를 이용해 주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getGradingType = (name: string, type: string) => {
    const n = normalizeSubjectName(name);
    const core = ['문학', '독서와 작문', '대수', '미적분Ⅰ', '영어Ⅰ', '영어Ⅱ'].map(normalizeSubjectName);
    if (core.includes(n)) return '수능 출제/5등급';
    const ach3 = ['운동과 건강', '스포츠 생활1', '스포츠 생활2', '음악 연주와 작창', '음악 연주와 창작', '미술 창작', '음악 감상과 비평', '미술과 매체', '음악과 미디어', '미술 감상과 비평', '스포츠 문화', '스포츠 문학', '스포츠 과학'].map(normalizeSubjectName);
    if (ach3.includes(n)) return '성취도 3단계';
    if (normalizeSubjectName('기후변화와 환경생태') === n) return '성취도 5단계';
    return '5등급';
  };

  const planData = useMemo(() => {
    if (!selectedMajor) return [];
    const groupsToUse = isCustomMode ? customGroups : SUNGSHIN_GROUPS;
    return groupsToUse.filter(g => g.grade === planGrade).map(group => {
      const subjectsWithMetadata = group.subjects.map(subject => {
        const nn = normalizeSubjectName(subject.name);
        const area = Object.keys(SUBJECT_AREAS).find(a => SUBJECT_AREAS[a].some(s => normalizeSubjectName(s) === nn)) || '기타';
        const typeKey = Object.keys(SUBJECT_TYPES).find(k => normalizeSubjectName(k) === nn);
        const type = typeKey ? SUBJECT_TYPES[typeKey] : '일반';
        const isRecommended = selectedMajor.recommendedSubjects.some(s => normalizeSubjectName(s) === nn);
        return { ...subject, area, type, isRecommended, gradingType: getGradingType(subject.name, type) };
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
  }, [selectedMajor, planGrade, isCustomMode, customGroups]);

  return (
    <div className="text-slate-900 flex flex-col gap-6" style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>

      {/* Top bar: search + custom curriculum button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="학과명 검색 (예: 의예과, 경영...)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-2 border-transparent rounded-full text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value.trim()) setSelectedMajor(null); }}
          />
        </div>
        <button
          onClick={() => setShowCustomForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all shrink-0"
        >
          <Settings className="w-4 h-4" />
          교육과정 직접 입력
        </button>
        {isCustomMode && (
          <button
            onClick={() => { setIsCustomMode(false); setCustomGroups([]); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all shrink-0"
          >
            <X className="w-4 h-4" />
            초기화
          </button>
        )}
      </div>

      {!selectedMajor ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <div className="flex items-center gap-2 px-2 py-1 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <LayoutGrid className="w-3 h-3" /><span>분야 카테고리</span>
            </div>
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
              {FIELD_DATA.map((field) => (
                <button
                  key={field.name}
                  onClick={() => handleFieldSelect(field)}
                  className={`whitespace-nowrap text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group shrink-0 md:shrink ${
                    selectedField?.name === field.name && !searchTerm
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="font-semibold text-sm">{field.name}</span>
                  <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${selectedField?.name === field.name && !searchTerm ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {searchTerm.trim() ? (
                <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Search className="text-blue-600 w-5 h-5" />
                      <h3 className="text-xl font-bold">검색 결과</h3>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">{searchResults.length}개의 학과 발견</span>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {searchResults.map((major) => (
                        <button key={`${major.fieldName}-${major.name}`} onClick={() => handleMajorSelect(major)}
                          className="text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">{major.fieldName}</div>
                          <div className="font-bold text-slate-700 group-hover:text-blue-700">{major.name}</div>
                          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><span>상세 과목 보기</span><ChevronRight className="w-3 h-3" /></div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                      <Search className="w-10 h-10" />
                      <p className="font-medium">검색 결과가 없습니다.</p>
                      <button onClick={() => setSearchTerm('')} className="text-blue-600 text-sm font-bold hover:underline">검색어 초기화</button>
                    </div>
                  )}
                </motion.div>
              ) : selectedField ? (
                <motion.div key={selectedField.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="text-blue-600 w-6 h-6" />
                      <h3 className="text-xl font-bold">{selectedField.name}</h3>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">{selectedField.majors.length}개의 학과</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedField.majors.map((major) => (
                      <button key={major.name} onClick={() => handleMajorSelect(major)}
                        className="text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                        <div className="font-bold text-slate-700 group-hover:text-blue-700">{major.name}</div>
                        <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><span>추천 과목 보기</span><ChevronRight className="w-3 h-3" /></div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 text-center space-y-4 min-h-[400px]">
                  <div className="bg-slate-50 p-6 rounded-full"><ListFilter className="w-12 h-12 text-slate-300" /></div>
                  <div>
                    <p className="font-bold text-xl text-slate-600">탐색을 시작해보세요</p>
                    <p className="text-sm max-w-xs mx-auto mt-2">왼쪽 카테고리에서 분야를 선택하거나 상단에서 학과를 직접 검색할 수 있습니다.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <button onClick={resetSelection} className="hover:text-blue-600 transition-colors">홈</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => setSelectedMajor(null)} className="hover:text-blue-600 transition-colors">{selectedField?.name}</button>
              <ChevronRight className="w-3 h-3" />
              <span className="font-semibold text-blue-600">{selectedMajor.name}</span>
            </div>
            <button onClick={() => setSelectedMajor(null)} className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-all shadow-md">
              다른 학과 찾기
            </button>
          </div>

          {/* Major header + view toggle */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><GraduationCap className="w-32 h-32" /></div>
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /><span>권장 선택과목 안내</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{selectedMajor.name}</h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                  {([
                    { key: 'subject' as const, icon: <Layers className="w-4 h-4" />, label: '교과군별' },
                    { key: 'group' as const, icon: <Calendar className="w-4 h-4" />, label: '선택그룹' },
                    { key: 'plan' as const, icon: <FileText className="w-4 h-4" />, label: '수강신청 계획서' },
                  ]).map(v => (
                    <button key={v.key} onClick={() => setViewMode(v.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === v.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {v.icon}{v.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-slate-500 font-medium">{selectedMajor.name} 전공을 희망하는 학생을 위한 맞춤형 과목 가이드입니다.</p>
            </div>
          </div>

          {/* University tips */}
          {universityTips.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="text-white w-5 h-5" />
                  <h3 className="text-white font-bold">2028학년도 대학별 권장과목 가이드 (출처: 학과바이블-캠퍼스멘토)</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="대학명 또는 지역 검색..." value={univSearchTerm}
                    onChange={(e) => setUnivSearchTerm(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 whitespace-nowrap">권역/지역</th>
                      <th className="px-6 py-3 whitespace-nowrap">대학교</th>
                      <th className="px-6 py-3 whitespace-nowrap">모집단위</th>
                      <th className="px-6 py-3">핵심과목</th>
                      <th className="px-6 py-3">권장과목</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {universityTips.map((tip, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">{tip.region}</span>
                            <span className="text-slate-600 font-medium">{tip.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{tip.university}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{tip.major}</td>
                        <td className="px-6 py-4">
                          {tip.core !== '-' ? <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium inline-block">{tip.core}</span> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="px-6 py-4">
                          {tip.recommended !== '-' && tip.recommended !== '' ? <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium inline-block">{tip.recommended}</span> : <span className="text-slate-300">-</span>}
                          {tip.note && tip.note !== '-' && <p className="text-[10px] text-slate-400 italic mt-1">{tip.note}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Subject views */}
          <div className="grid grid-cols-1 gap-6">
            {viewMode === 'subject' ? (
              Object.entries(subjectsByArea || {}).map(([area, subjects]) => (
                <motion.div key={area} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <span className="w-2 h-6 bg-blue-600 rounded-full"></span>{area} 교과군
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">{(subjects as string[]).length}개 과목</span>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(subjects as string[]).map((subject) => {
                        const type = SUBJECT_TYPES[subject] || '일반';
                        const typeColors: Record<string, string> = {
                          '일반': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                          '진로': 'bg-blue-50 text-blue-700 border-blue-100',
                          '융합': 'bg-purple-50 text-purple-700 border-purple-100'
                        };
                        return (
                          <div key={subject} className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow flex flex-col justify-between gap-3">
                            <div className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md inline-block self-start">{subject}</div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${typeColors[type] || typeColors['일반']}`}>{type} 선택</span>
                              <button className="text-slate-300 hover:text-blue-500 transition-colors"><Info className="w-4 h-4" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : viewMode === 'group' ? (
              (isCustomMode ? customGroups : SUNGSHIN_GROUPS).map((group) => {
                const recommendedInGroup = group.subjects.filter(s => selectedMajor.recommendedSubjects.includes(s.name));
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${recommendedInGroup.length > 0 ? 'border-blue-200 ring-1 ring-blue-50' : 'border-slate-200 opacity-80'}`}>
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${recommendedInGroup.length > 0 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-fit px-3 h-10 rounded-xl flex items-center justify-center font-bold whitespace-nowrap ${recommendedInGroup.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{group.id}</div>
                        <div>
                          <h4 className={`font-bold ${recommendedInGroup.length > 0 ? 'text-blue-900' : 'text-slate-700'}`}>{group.description}</h4>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{group.semester}</p>
                        </div>
                      </div>
                      {recommendedInGroup.length > 0 && <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-full">추천 과목 있음</div>}
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.subjects.map((subject) => {
                          const isRecommended = selectedMajor.recommendedSubjects.includes(subject.name);
                          const type = SUBJECT_TYPES[subject.name] || '일반';
                          return (
                            <div key={subject.name} onClick={() => setSelectedSubjectName(subject.name)}
                              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 cursor-pointer group/card ${isRecommended ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02] hover:shadow-lg' : 'border-slate-100 bg-white opacity-60 hover:opacity-100 hover:border-slate-300'}`}>
                              <div className="flex items-center justify-between">
                                <div className={`font-bold px-2 py-1 rounded-md inline-block ${isRecommended ? 'text-blue-700 bg-white group-hover/card:bg-blue-600 group-hover/card:text-white' : 'text-slate-500 bg-slate-100'}`}>{subject.name}</div>
                                <div className="flex items-center gap-1">
                                  <Info className="w-3 h-3 text-slate-400 opacity-0 group-hover/card:opacity-100" />
                                  {isRecommended && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isRecommended ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{type} 선택</span>
                                <span className="text-[9px] text-slate-400 font-bold">{subject.semesters.join(', ')}학기</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="space-y-4">
                {/* Plan action bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg"><FileText className="text-blue-600 w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-slate-800">수강 신청 계획서</h3>
                      <p className="text-xs text-slate-400">{selectedMajor.name} 전공 권장</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {errorMsg && <div className="text-xs text-red-500 font-medium max-w-[200px]">{errorMsg}</div>}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      {([2, 3] as const).map(g => (
                        <button key={g} onClick={() => setPlanGrade(g)}
                          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${planGrade === g ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {g}학년
                        </button>
                      ))}
                    </div>
                    <button onClick={handleDownloadPDF} disabled={isDownloading}
                      className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${isDownloading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}>
                      {isDownloading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                      {isDownloading ? '생성 중...' : `${planGrade}학년 PDF`}
                    </button>
                  </div>
                </div>

                {/* Printable plan table */}
                <div ref={printRef} className="bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <div style={{ borderBottom: '1px solid #cbd5e1', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e40af' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText style={{ color: '#ffffff', width: '1rem', height: '1rem' }} />
                      <h3 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>{planGrade}학년 수강 신청 계획서</h3>
                    </div>
                    <div style={{ color: '#dbeafe', fontSize: '0.65rem', fontWeight: 'bold' }}>숭신고등학교 | {selectedMajor.name} 전공 권장</div>
                  </div>
                  <div style={{ padding: '1.2rem', overflow: 'visible' }}>
                    <table style={{ width: '100%', fontSize: '0.65rem', textAlign: 'left', borderCollapse: 'collapse', border: '1px solid #cbd5e1', tableLayout: 'fixed' }}>
                      <thead style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1' }}>
                        <tr>
                          <th style={{ padding: '0.5rem 0.4rem', borderRight: '1px solid #cbd5e1', width: '4rem', textAlign: 'center' }}>선택 방법</th>
                          <th style={{ padding: '0.5rem 0.4rem', borderRight: '1px solid #cbd5e1', width: '6rem' }}>교과군</th>
                          <th style={{ padding: '0.5rem 0.4rem', borderRight: '1px solid #cbd5e1' }}>과목</th>
                          <th style={{ padding: '0.5rem 0.4rem', borderRight: '1px solid #cbd5e1', width: '4.5rem', textAlign: 'center' }}>과목 구분</th>
                          <th style={{ padding: '0.5rem 0.4rem', borderRight: '1px solid #cbd5e1', width: '3rem', textAlign: 'center' }}>1학기</th>
                          <th style={{ padding: '0.5rem 0.4rem', borderRight: '1px solid #cbd5e1', width: '3rem', textAlign: 'center' }}>2학기</th>
                          <th style={{ padding: '0.5rem 0.4rem', borderRight: '1px solid #cbd5e1', width: '6rem', textAlign: 'center' }}>성적처리 유형</th>
                          <th style={{ padding: '0.5rem 0.4rem', width: '5rem', textAlign: 'center' }}>메모</th>
                        </tr>
                      </thead>
                      <tbody style={{ borderTop: '1px solid #cbd5e1' }}>
                        {((isCustomMode ? customMandatory[planGrade] : MANDATORY_SUBJECTS[planGrade]) || []).map((subject, idx) => {
                          const nn = normalizeSubjectName(subject.name);
                          const area = Object.keys(SUBJECT_AREAS).find(a => SUBJECT_AREAS[a].some(s => normalizeSubjectName(s) === nn)) || '공통';
                          const typeKey = Object.keys(SUBJECT_TYPES).find(k => normalizeSubjectName(k) === nn);
                          const type = typeKey ? SUBJECT_TYPES[typeKey] : '일반';
                          return (
                            <tr key={`m-${subject.name}`} style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #cbd5e1' }}>
                              {idx === 0 && (
                                <td rowSpan={((isCustomMode ? customMandatory[planGrade] : MANDATORY_SUBJECTS[planGrade]) || []).length}
                                  style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', fontWeight: '900', textAlign: 'center', fontSize: '0.6rem' }}>필수</td>
                              )}
                              <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>{area}</td>
                              <td onClick={() => setSelectedSubjectName(subject.name)} style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}>{subject.name}</td>
                              <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontSize: '7px' }}>{type} 선택</td>
                              <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                                {subject.semesters.includes(1) && <div style={{ width: '0.9rem', height: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '0.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', margin: '0 auto' }}><CheckSquare style={{ width: '0.7rem', height: '0.7rem' }} /></div>}
                              </td>
                              <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                                {subject.semesters.includes(2) && <div style={{ width: '0.9rem', height: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '0.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', margin: '0 auto' }}><CheckSquare style={{ width: '0.7rem', height: '0.7rem' }} /></div>}
                              </td>
                              <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontSize: '8px' }}>{getGradingType(subject.name, type)}</td>
                              <td style={{ padding: '0.4rem' }}></td>
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
                                    backgroundColor: subject.isRecommended ? '#eff6ff' : '#ffffff',
                                    borderBottom: isLastInGroup ? '2px solid #475569' : '1px solid #cbd5e1',
                                    borderTop: (aIdx === 0 && sIdx === 0) ? '2px solid #475569' : 'none'
                                  }}>
                                    {aIdx === 0 && sIdx === 0 && (
                                      <td rowSpan={group.subjects.length} style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ffffff', verticalAlign: 'middle' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 'bold', lineHeight: '1.2' }}>{group.id}<br />[택{group.selectCount}]<br />({group.credits || 4}학점)</div>
                                      </td>
                                    )}
                                    {sIdx === 0 && (
                                      <td rowSpan={areaGroup.subjects.length} style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', fontWeight: '500', backgroundColor: '#ffffff' }}>{areaGroup.area}</td>
                                    )}
                                    <td onClick={() => setSelectedSubjectName(subject.name)} style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', fontWeight: subject.isRecommended ? 'bold' : '500', cursor: 'pointer' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>{subject.name}<Info style={{ width: '0.5rem', height: '0.5rem', color: '#cbd5e1' }} /></div>
                                    </td>
                                    <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                                      <span style={{ fontSize: '7px', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 'bold', backgroundColor: subject.type === '진로' ? '#dbeafe' : subject.type === '융합' ? '#f3e8ff' : '#d1fae5', border: '1px solid #cbd5e1' }}>{subject.type} 선택</span>
                                    </td>
                                    <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                                      {subject.semesters.includes(1) && <div style={{ width: '0.9rem', height: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '0.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: subject.isRecommended ? '#000000' : '#ffffff', margin: '0 auto' }}>{subject.isRecommended && <CheckSquare style={{ width: '0.7rem', height: '0.7rem', color: '#ffffff' }} />}</div>}
                                    </td>
                                    <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                                      {subject.semesters.includes(2) && <div style={{ width: '0.9rem', height: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '0.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: subject.isRecommended ? '#000000' : '#ffffff', margin: '0 auto' }}>{subject.isRecommended && <CheckSquare style={{ width: '0.7rem', height: '0.7rem', color: '#ffffff' }} />}</div>}
                                    </td>
                                    <td style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontSize: '8px' }}>{subject.gradingType}</td>
                                    <td style={{ padding: '0.4rem' }}></td>
                                  </tr>
                                );
                              })
                            ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '0.8rem 1.5rem', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>* 본 계획서는 학생의 전공 적합성을 고려한 추천 안이며, 실제 수강 신청 시 변경될 수 있습니다.</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>제작 : 숭신고등학교 진로진학상담부 김강석</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-4">
            <Info className="text-blue-600 w-6 h-6 shrink-0" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-bold">안내 사항</p>
              <p>위 과목 리스트는 일반적인 권장 사항이며, 실제 학교의 교육과정 편성 현황에 따라 다를 수 있습니다.</p>
              <p>대학별로 요구하는 핵심 권장 과목이 다를 수 있으니, 목표 대학의 입학처 홈페이지를 반드시 참고하시기 바랍니다.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom curriculum modal */}
      <AnimatePresence>
        {showCustomForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomForm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-xl text-white"><Settings className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">교육과정 직접 입력</h3>
                    <p className="text-xs text-slate-500">학년별 선택 그룹과 과목을 직접 구성합니다.</p>
                  </div>
                </div>
                <button onClick={() => setShowCustomForm(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /><h4 className="font-bold text-slate-800">학년별 필수 과목</h4></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[['2-1', '2학년 1학기 필수'], ['2-2', '2학년 2학기 필수'], ['3-1', '3학년 1학기 필수'], ['3-2', '3학년 2학기 필수']] .map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>
                        <textarea value={tempMandatory[key as keyof typeof tempMandatory]}
                          onChange={(e) => setTempMandatory({ ...tempMandatory, [key]: e.target.value })}
                          placeholder="과목명을 쉼표(,)로 구분하여 입력"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /><h4 className="font-bold text-slate-800">선택 과목 그룹</h4></div>
                  <button onClick={handleAddGroup} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"><Plus className="w-4 h-4" />추가하기</button>
                </div>
                {tempGroups.map((group) => (
                  <div key={group.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group/row">
                    <button onClick={() => handleRemoveGroup(group.id)} className="absolute -top-2 -right-2 bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover/row:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: '학년', field: 'grade', type: 'select', options: [{ v: 2, l: '2학년' }, { v: 3, l: '3학년' }] },
                        { label: '학기', field: 'semester', type: 'select', options: [{ v: '1학기', l: '1학기' }, { v: '2학기', l: '2학기' }] },
                        { label: '학점', field: 'credits', type: 'number' },
                        { label: '선택과목수', field: 'selectCount', type: 'number' },
                      ].map((f) => (
                        <div key={f.field} className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 ml-1">{f.label}</label>
                          {f.type === 'select' ? (
                            <select value={group[f.field]} onChange={(e) => handleUpdateGroup(group.id, f.field, f.field === 'grade' ? parseInt(e.target.value) : e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                              {f.options!.map(o => <option key={String(o.v)} value={o.v}>{o.l}</option>)}
                            </select>
                          ) : (
                            <input type="number" value={group[f.field]} onChange={(e) => handleUpdateGroup(group.id, f.field, parseInt(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">선택과목 리스트 (쉼표로 구분)</label>
                      <textarea value={group.subjects} onChange={(e) => handleUpdateGroup(group.id, 'subjects', e.target.value)}
                        placeholder="예: 물리학, 화학, 생명과학, 지구과학"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none" />
                    </div>
                  </div>
                ))}
                <button onClick={handleAddGroup} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-200 hover:text-blue-500 transition-all">
                  <Plus className="w-5 h-5" />항목 추가하기
                </button>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button onClick={() => setShowCustomForm(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700">취소</button>
                <button onClick={handleDone} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"><Save className="w-4 h-4" />교육과정 생성 완료</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subject details modal */}
      <AnimatePresence>
        {selectedSubjectName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSubjectName(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl text-white backdrop-blur-sm"><BookOpen className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedSubjectName}</h3>
                    <p className="text-xs text-blue-100 opacity-80">과목 상세 정보</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSubjectName(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors group"><X className="w-5 h-5 text-white transition-transform group-hover:rotate-90" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {SUBJECT_DETAILS[selectedSubjectName] ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-6 bg-blue-500 rounded-full"></div><h4 className="font-bold text-slate-800 text-lg">과목의 특성</h4></div>
                      <p className="text-slate-600 leading-relaxed pl-3.5 border-l border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].characteristics}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2"><div className="bg-blue-600 p-1.5 rounded-lg text-white"><FileText className="w-4 h-4" /></div><h4 className="font-bold text-slate-800 text-lg">과목 정보</h4></div>
                      <div className="overflow-x-auto rounded-xl border border-blue-200">
                        <table className="w-full text-[11px] border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-blue-50 text-blue-900 font-bold border-b border-blue-200">
                              <th rowSpan={3} className="p-2 border-r border-blue-200 w-16">교과(군)</th>
                              <th rowSpan={3} className="p-2 border-r border-blue-200 w-16">선택 유형</th>
                              <th colSpan={6} className="p-1 border-b border-blue-200 text-center">평가 정보</th>
                              <th rowSpan={3} className="p-2 w-20">2028 수능 출제 과목</th>
                            </tr>
                            <tr className="bg-blue-50 text-blue-900 font-bold border-b border-blue-200">
                              <th colSpan={2} className="p-1 border-r border-blue-200 text-center">절대 평가</th>
                              <th className="p-1 border-r border-blue-200 text-center">상대 평가</th>
                              <th colSpan={3} className="p-1 border-r border-blue-200 text-center">통계 정보</th>
                            </tr>
                            <tr className="bg-blue-50 text-blue-800 font-medium">
                              <th className="p-1 border-r border-blue-200">원점수</th>
                              <th className="p-1 border-r border-blue-200">성취도</th>
                              <th className="p-1 border-r border-blue-200">석차 등급</th>
                              <th className="p-1 border-r border-blue-200 text-[9px] leading-tight">성취도별 분포 비율</th>
                              <th className="p-1 border-r border-blue-200">과목 평균</th>
                              <th className="p-1 border-r border-blue-200">수강자 수</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            <tr className="text-center text-slate-700 font-medium">
                              <td className="p-3 border-r border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].area}</td>
                              <td className="p-3 border-r border-slate-100">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SUBJECT_DETAILS[selectedSubjectName].type === '일반' ? 'bg-amber-400 text-amber-950' : SUBJECT_DETAILS[selectedSubjectName].type === '진로' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {SUBJECT_DETAILS[selectedSubjectName].type}
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].absoluteScore}</td>
                              <td className="p-3 border-r border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].absoluteAchievement}</td>
                              <td className="p-3 border-r border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].relativeRank}</td>
                              <td className="p-3 border-r border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].statDistribution}</td>
                              <td className="p-3 border-r border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].statAverage}</td>
                              <td className="p-3 border-r border-slate-100">{SUBJECT_DETAILS[selectedSubjectName].statStudents}</td>
                              <td className="p-3">{SUBJECT_DETAILS[selectedSubjectName].suneung}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-6 bg-violet-500 rounded-full"></div><h4 className="font-bold text-slate-800 text-lg">주요 내용</h4></div>
                      <ul className="grid grid-cols-1 gap-2 pl-3.5">
                        {SUBJECT_DETAILS[selectedSubjectName].contents.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-violet-200 transition-colors">
                            <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                            <span className="text-slate-600 text-sm font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Search className="w-8 h-8 text-slate-300" /></div>
                    <div>
                      <p className="text-slate-500 font-bold">과목 정보를 준비 중입니다.</p>
                      <p className="text-slate-400 text-sm">2022 개정 교육과정 기준 상세 내용을 업데이트하고 있습니다.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setSelectedSubjectName(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all">닫기</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
