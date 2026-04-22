import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { supabase } from '@/lib/supabase';

type Params = Promise<{ id: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const teacherId = (session.user as { teacherId?: string }).teacherId;
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabase
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
  const { id } = await params;

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)
    .eq('teacher_id', teacherId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
