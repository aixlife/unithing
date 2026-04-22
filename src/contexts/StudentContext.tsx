'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '@/lib/supabase';
import { SegibuAnalysis } from '@/types/analysis';

type StudentContextType = {
  students: Student[];
  currentStudent: Student | null;
  setCurrentStudent: (s: Student | null) => void;
  loadStudents: () => Promise<void>;
  addStudent: (data: Omit<Student, 'id' | 'teacher_id' | 'created_at'>) => Promise<Student | null>;
  segibuAnalysis: SegibuAnalysis | null;
  analyzeSegibu: (file: File) => Promise<void>;
  analysisLoading: boolean;
  analysisError: string | null;
};

const StudentContext = createContext<StudentContextType | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [segibuAnalysis, setSegibuAnalysis] = useState<SegibuAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
      if (!currentStudent && data.length > 0) setCurrentStudent(data[0]);
    }
  };

  const addStudent = async (body: Omit<Student, 'id' | 'teacher_id' | 'created_at'>) => {
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

  useEffect(() => { loadStudents(); }, []);
  // 학생 바뀌면 분석 초기화
  useEffect(() => { setSegibuAnalysis(null); setAnalysisError(null); }, [currentStudent?.id]);

  return (
    <StudentContext.Provider value={{ students, currentStudent, setCurrentStudent, loadStudents, addStudent, segibuAnalysis, analyzeSegibu, analysisLoading, analysisError }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider');
  return ctx;
}
