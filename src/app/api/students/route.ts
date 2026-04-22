import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const teacherId = (session.user as { teacherId?: string }).teacherId;
  const { data, error } = await supabase
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
  const body = await req.json();

  const { data, error } = await supabase
    .from('students')
    .insert({ ...body, teacher_id: teacherId })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
