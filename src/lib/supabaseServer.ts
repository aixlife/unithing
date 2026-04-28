import { createClient } from '@supabase/supabase-js';
import type { NaesinData } from '@/types/student';
import type { SegibuAnalysis } from '@/types/analysis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseServer = createClient(supabaseUrl, serverKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const isUsingSupabaseServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export type StudentRow = {
  id: string;
  teacher_id: string;
  name: string;
  grade: string;
  school: string;
  target_dept: string;
  naesin_data: NaesinData | null;
  segibu_pdf_url: string | null;
  segibu_analysis: SegibuAnalysis | null;
  created_at: string;
};
