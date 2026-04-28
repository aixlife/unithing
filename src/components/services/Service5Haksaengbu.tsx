'use client';
import { useStudent } from '@/contexts/StudentContext';
import { StudentReportView } from '@/components/services/StudentReportView';

export function Service5Haksaengbu() {
  const { segibuAnalysis, currentStudent } = useStudent();
  return <StudentReportView segibuAnalysis={segibuAnalysis} studentName={currentStudent?.name} />;
}
