import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { supabaseServer } from '@/lib/supabaseServer';

const ALLOWED_CREATE_FIELDS = [
  'name',
  'grade',
  'school',
  'target_dept',
  'naesin_data',
  'segibu_pdf_url',
] as const;

function pickAllowedCreateFields(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const body = raw as Record<string, unknown>;
  return ALLOWED_CREATE_FIELDS.reduce<Record<string, unknown>>((acc, key) => {
    if (key in body) acc[key] = body[key];
    return acc;
  }, {});
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const teacherId = (session.user as { teacherId?: string }).teacherId;
  if (!teacherId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseServer
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const teacherId = (session.user as { teacherId?: string }).teacherId;
  if (!teacherId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = pickAllowedCreateFields(await req.json());

  const { data, error } = await supabaseServer
    .from('students')
    .insert({ ...body, teacher_id: teacherId })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
