'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Student } from '@/lib/supabase';
import { normalizeSegibuAnalysis, sanitizeSegibuAnalysisForStorage } from '@/lib/segibuAnalysis';
import { SegibuAnalysis } from '@/types/analysis';

type StudentCreate = Omit<Student, 'id' | 'teacher_id' | 'created_at' | 'segibu_analysis'>;
export type StudentUpdate = Partial<Pick<Student, 'name' | 'grade' | 'school' | 'target_dept' | 'naesin_data' | 'segibu_pdf_url' | 'segibu_analysis'>>;

type StudentContextType = {
  students: Student[];
  currentStudent: Student | null;
  setCurrentStudent: (s: Student | null) => void;
  loadStudents: () => Promise<void>;
  addStudent: (data: StudentCreate) => Promise<Student | null>;
  updateStudent: (id: string, data: StudentUpdate) => Promise<Student | null>;
  deleteStudent: (id: string) => Promise<void>;
  segibuAnalysis: SegibuAnalysis | null;
  analyzeSegibu: (input: File | string, studentOverride?: Student) => Promise<void>;
  clearSegibuAnalysis: () => Promise<void>;
  retrySaveSegibuAnalysis: () => Promise<void>;
  analysisLoading: boolean;
  analysisError: string | null;
  analysisSaveError: string | null;
  analysisSaveLoading: boolean;
};

const StudentContext = createContext<StudentContextType | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);
  const [manualAnalysis, setManualAnalysis] = useState<SegibuAnalysis | null>(null);
  const [manualAnalysisStudentId, setManualAnalysisStudentId] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSaveError, setAnalysisSaveError] = useState<string | null>(null);
  const [analysisSaveLoading, setAnalysisSaveLoading] = useState(false);

  const setCurrentStudent = useCallback((s: Student | null) => {
    setCurrentStudentState(s);
    setAnalysisError(null);
    setAnalysisSaveError(null);
  }, []);

  const segibuAnalysis = useMemo(() => {
    if (manualAnalysis && (manualAnalysisStudentId ? manualAnalysisStudentId === currentStudent?.id : !currentStudent)) {
      return manualAnalysis;
    }
    const raw = currentStudent?.segibu_analysis;
    return normalizeSegibuAnalysis(raw);
  }, [currentStudent, manualAnalysis, manualAnalysisStudentId]);

  const saveSegibuAnalysis = useCallback(async (target: Student, data: SegibuAnalysis) => {
    const storedAnalysis = sanitizeSegibuAnalysisForStorage(data);
    const patchRes = await fetch(`/api/students/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segibu_analysis: storedAnalysis }),
    });
    if (!patchRes.ok) {
      let message = '분석 결과 저장 실패';
      try {
        const payload = await patchRes.json();
        if (typeof payload?.error === 'string') message = payload.error;
      } catch {
        message = `분석 결과 저장 실패 (${patchRes.status})`;
      }
      throw new Error(message);
    }
    const updated: Student = await patchRes.json();
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    setCurrentStudentState(updated);
    return updated;
  }, []);

  const analyzeSegibu = async (input: File | string, studentOverride?: Student) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisSaveError(null);
    try {
      let res: Response;
      if (typeof input === 'string') {
        res = await fetch('/api/analyze/segibu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input, privacyConfirmed: true }),
        });
      } else {
        const form = new FormData();
        form.append('file', input);
        form.append('privacyConfirmed', 'true');
        res = await fetch('/api/analyze/segibu', { method: 'POST', body: form });
      }
      if (!res.ok) {
        let message = '분석 실패';
        try {
          const payload = await res.json();
          if (typeof payload?.error === 'string') message = payload.error;
        } catch {
          message = `분석 실패 (${res.status})`;
        }
        throw new Error(message);
      }
      const data = normalizeSegibuAnalysis(await res.json());
      if (!data) throw new Error('분석 결과 형식이 올바르지 않습니다.');

      const target = studentOverride ?? currentStudent;
      setManualAnalysis(data);
      setManualAnalysisStudentId(target?.id ?? null);
      if (target) {
        try {
          await saveSegibuAnalysis(target, data);
        } catch (saveError) {
          setAnalysisSaveError(saveError instanceof Error ? saveError.message : String(saveError));
        }
      }
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const retrySaveSegibuAnalysis = async () => {
    if (!currentStudent) {
      setAnalysisSaveError('학생을 선택한 뒤 저장을 다시 시도하세요.');
      return;
    }

    const pendingAnalysis =
      manualAnalysis && (manualAnalysisStudentId ? manualAnalysisStudentId === currentStudent.id : true)
        ? manualAnalysis
        : normalizeSegibuAnalysis(currentStudent.segibu_analysis);

    if (!pendingAnalysis) {
      setAnalysisSaveError('다시 저장할 분석 결과를 찾지 못했습니다. 분석이 완료된 화면에서 다시 시도하세요.');
      return;
    }

    setAnalysisSaveLoading(true);
    setAnalysisSaveError(null);
    try {
      await saveSegibuAnalysis(currentStudent, pendingAnalysis);
      setManualAnalysis(null);
      setManualAnalysisStudentId(null);
    } catch (e) {
      setAnalysisSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalysisSaveLoading(false);
    }
  };

  const clearSegibuAnalysis = async () => {
    setManualAnalysis(null);
    setManualAnalysisStudentId(null);
    setAnalysisError(null);
    setAnalysisSaveError(null);
    if (!currentStudent) return;
    const patchRes = await fetch(`/api/students/${currentStudent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segibu_analysis: null }),
    });
    if (patchRes.ok) {
      const updated: Student = await patchRes.json();
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      setCurrentStudentState(updated);
    }
  };

  const loadStudents = async () => {
    const res = await fetch('/api/students');
    if (res.ok) {
      const data: Student[] = await res.json();
      setStudents(data);
      // 현재 선택된 학생이 없으면 첫 번째 학생 자동 선택 (분석 결과 포함)
      if (!currentStudent && data.length > 0) setCurrentStudent(data[0]);
    }
  };

  const addStudent = async (body: StudentCreate) => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const student: Student = await res.json();
    setStudents(prev => [student, ...prev]);
    setCurrentStudent(student);
    return student;
  };

  const updateStudent = async (id: string, body: StudentUpdate) => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const updated: Student = await res.json();
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (currentStudent?.id === updated.id) setCurrentStudentState(updated);
    return updated;
  };

  const deleteStudent = async (id: string) => {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    const remaining = students.filter(s => s.id !== id);
    setStudents(remaining);
    if (currentStudent?.id === id) {
      setCurrentStudent(remaining[0] ?? null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/students')
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data: Student[] = await res.json();
        if (cancelled) return;
        setStudents(data);
        if (data.length > 0) setCurrentStudent(data[0]);
      })
      .catch(() => { /* initial load failure is shown by empty state */ });

    return () => { cancelled = true; };
  }, [setCurrentStudent]);

  return (
    <StudentContext.Provider value={{
      students, currentStudent, setCurrentStudent, loadStudents,
      addStudent, updateStudent, deleteStudent,
      segibuAnalysis, analyzeSegibu, clearSegibuAnalysis, retrySaveSegibuAnalysis,
      analysisLoading, analysisError, analysisSaveError, analysisSaveLoading,
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider');
  return ctx;
}
