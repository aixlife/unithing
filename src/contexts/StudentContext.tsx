'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Student } from '@/lib/supabase';
import { normalizeSegibuAnalysis } from '@/lib/segibuAnalysis';
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
  analysisLoading: boolean;
  analysisError: string | null;
};

const StudentContext = createContext<StudentContextType | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);
  const [manualAnalysis, setManualAnalysis] = useState<SegibuAnalysis | null>(null);
  const [manualAnalysisStudentId, setManualAnalysisStudentId] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const setCurrentStudent = useCallback((s: Student | null) => {
    setCurrentStudentState(s);
    setAnalysisError(null);
  }, []);

  const segibuAnalysis = useMemo(() => {
    if (manualAnalysis && (manualAnalysisStudentId ? manualAnalysisStudentId === currentStudent?.id : !currentStudent)) {
      return manualAnalysis;
    }
    const raw = currentStudent?.segibu_analysis;
    return normalizeSegibuAnalysis(raw);
  }, [currentStudent, manualAnalysis, manualAnalysisStudentId]);

  const analyzeSegibu = async (input: File | string, studentOverride?: Student) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      let res: Response;
      if (typeof input === 'string') {
        res = await fetch('/api/analyze/segibu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input }),
        });
      } else {
        const form = new FormData();
        form.append('file', input);
        res = await fetch('/api/analyze/segibu', { method: 'POST', body: form });
      }
      if (!res.ok) throw new Error((await res.json()).error ?? '분석 실패');
      const data = normalizeSegibuAnalysis(await res.json());
      if (!data) throw new Error('분석 결과 형식이 올바르지 않습니다.');

      const target = studentOverride ?? currentStudent;
      setManualAnalysis(data);
      setManualAnalysisStudentId(target?.id ?? null);
      if (target) {
        const patchRes = await fetch(`/api/students/${target.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segibu_analysis: data }),
        });
        if (patchRes.ok) {
          const updated: Student = await patchRes.json();
          setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
          setCurrentStudentState(updated);
        }
      }
    } catch (e) {
      setAnalysisError(String(e));
    } finally {
      setAnalysisLoading(false);
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
      segibuAnalysis, analyzeSegibu, analysisLoading, analysisError,
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
