import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { supabaseServer } from '@/lib/supabaseServer';

type Params = Promise<{ id: string }>;
const ALLOWED_UPDATE_FIELDS = [
  'name',
  'grade',
  'school',
  'target_dept',
  'naesin_data',
  'segibu_pdf_url',
  'segibu_analysis',
] as const;

function pickAllowedUpdateFields(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const body = raw as Record<string, unknown>;
  return ALLOWED_UPDATE_FIELDS.reduce<Record<string, unknown>>((acc, key) => {
    if (key in body) acc[key] = body[key];
    return acc;
  }, {});
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const teacherId = (session.user as { teacherId?: string }).teacherId;
  if (!teacherId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = pickAllowedUpdateFields(await req.json());

  if (Object.keys(body).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('students')
    .update(body)
    .eq('id', id)
    .eq('teacher_id', teacherId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const teacherId = (session.user as { teacherId?: string }).teacherId;
  if (!teacherId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { error } = await supabaseServer
    .from('students')
    .delete()
    .eq('id', id)
    .eq('teacher_id', teacherId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
