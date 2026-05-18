import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/authOptions';
import { supabaseServer } from '@/lib/supabaseServer';

function todayKst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

type VisitStatsRow = {
  today_count: number | string | null;
  total_count: number | string | null;
  day: string | null;
};

function toCount(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowToStats(row: VisitStatsRow | null, fallbackDay: string) {
  return {
    today: toCount(row?.today_count),
    total: toCount(row?.total_count),
    day: row?.day ?? fallbackDay,
  };
}

async function readStats(day: string) {
  const { data, error } = await supabaseServer
    .rpc('get_site_teacher_visit_stats', { visit_day: day })
    .single();

  if (error) throw error;
  return rowToStats(data as VisitStatsRow | null, day);
}

async function recordVisit(teacherId: string, day: string) {
  const { data, error } = await supabaseServer
    .rpc('record_site_teacher_visit', { teacher_id: teacherId, visit_day: day })
    .single();

  if (error) throw error;
  return rowToStats(data as VisitStatsRow | null, day);
}

function unavailableResponse(status = 200) {
  return NextResponse.json({
    available: false,
    today: 0,
    total: 0,
    day: todayKst(),
  }, { status });
}

async function getTeacherId() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { teacherId?: string; email?: string | null; name?: string | null } | undefined;
  if (!user?.email) return null;
  if (user.teacherId) return user.teacherId;

  const { data, error } = await supabaseServer
    .from('teachers')
    .upsert(
      { email: user.email, name: user.name ?? '' },
      { onConflict: 'email' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data?.id ?? null;
}

export async function GET() {
  try {
    const teacherId = await getTeacherId();
    if (!teacherId) return unavailableResponse(401);

    const stats = await readStats(todayKst());
    return NextResponse.json({ available: true, ...stats });
  } catch (error) {
    console.error('visit stats read failed', error);
    return unavailableResponse();
  }
}

export async function POST() {
  try {
    const teacherId = await getTeacherId();
    if (!teacherId) return unavailableResponse(401);

    const day = todayKst();
    const stats = await recordVisit(teacherId, day);
    return NextResponse.json({ available: true, ...stats });
  } catch (error) {
    console.error('visit stats record failed', error);
    return unavailableResponse();
  }
}
