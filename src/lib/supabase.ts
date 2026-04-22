import { createClient } from '@supabase/supabase-js';

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
  created_at: string;
};
