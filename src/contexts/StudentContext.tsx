'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '@/lib/supabase';
import { SegibuAnalysis } from '@/types/analysis';

type StudentContextType = {
  students: Student[];
  currentStudent: Student | null;
  setCurrentStudent: (s: Student | null) => void;
  loadStudents: () => Promise<void>;
  addStudent: (data: Omit<Student, 'id' | 'teacher_id' | 'created_at' | 'segibu_analysis'>) => Promise<Student | null>;
  deleteStudent: (id: string) => Promise<void>;
  segibuAnalysis: SegibuAnalysis | null;
  analyzeSegibu: (file: File) => Promise<void>;
  analysisLoading: boolean;
  analysisError: string | null;
};

const StudentContext = createContext<StudentContextType | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);
  const [segibuAnalysis, setSegibuAnalysis] = useState<SegibuAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const setCurrentStudent = (s: Student | null) => {
    setCurrentStudentState(s);
  };

  // 학생 바뀌면 저장된 분석 결과 로드 (없거나 구형 포맷이면 null)
  useEffect(() => {
    const raw = currentStudent?.segibu_analysis;
    // structuredData 필드 존재 여부로 신규 포맷 검증 — 구형이면 재분석 유도
    if (raw && raw.structuredData && raw.highlights && raw.scores) {
      setSegibuAnalysis(raw);
    } else {
      setSegibuAnalysis(null);
    }
    setAnalysisError(null);
  }, [currentStudent?.id]);

  const analyzeSegibu = async (file: File) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/analyze/segibu', { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? '분석 실패');
      const data: SegibuAnalysis = await res.json();
      setSegibuAnalysis(data);

      // 현재 학생에 분석 결과 DB 저장
      if (currentStudent) {
        const patchRes = await fetch(`/api/students/${currentStudent.id}`, {
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

  const addStudent = async (body: Omit<Student, 'id' | 'teacher_id' | 'created_at' | 'segibu_analysis'>) => {
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

  const deleteStudent = async (id: string) => {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    const remaining = students.filter(s => s.id !== id);
    setStudents(remaining);
    if (currentStudent?.id === id) {
      setCurrentStudent(remaining[0] ?? null);
    }
  };

  useEffect(() => { loadStudents(); }, []);

  return (
    <StudentContext.Provider value={{
      students, currentStudent, setCurrentStudent, loadStudents,
      addStudent, deleteStudent,
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
