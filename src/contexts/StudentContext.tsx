'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '@/lib/supabase';

type StudentContextType = {
  students: Student[];
  currentStudent: Student | null;
  setCurrentStudent: (s: Student | null) => void;
  loadStudents: () => Promise<void>;
  addStudent: (data: Omit<Student, 'id' | 'teacher_id' | 'created_at'>) => Promise<Student | null>;
};

const StudentContext = createContext<StudentContextType | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

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

  return (
    <StudentContext.Provider value={{ students, currentStudent, setCurrentStudent, loadStudents, addStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider');
  return ctx;
}
