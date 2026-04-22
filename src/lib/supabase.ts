import { createClient } from '@supabase/supabase-js';
import type { SegibuAnalysis } from '@/types/analysis';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Student = {
  id: string;
  teacher_id: string;
  name: string;
  grade: string;
  school: string;
  target_dept: string;
  naesin_data: Record<string, unknown> | null;
  segibu_pdf_url: string | null;
  segibu_analysis: SegibuAnalysis | null;
  created_at: string;
};
