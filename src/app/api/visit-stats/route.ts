import { NextRequest, NextResponse } from 'next/server';
import { isUsingSupabaseServiceRole, supabaseServer } from '@/lib/supabaseServer';

const VISITOR_COOKIE = 'unithing_visitor_id';
const TWO_YEARS = 60 * 60 * 24 * 365 * 2;

function todayKst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isVisitorId(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f-]{36}$/i.test(value));
}

function newVisitorId() {
  return crypto.randomUUID();
}

function withVisitorCookie(response: NextResponse, visitorId: string) {
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TWO_YEARS,
  });
  return response;
}

async function readStats(day: string) {
  const [todayResult, totalResult] = await Promise.all([
    supabaseServer
      .from('site_daily_visitors')
      .select('visitor_id', { count: 'exact', head: true })
      .eq('day', day),
    supabaseServer
      .from('site_visitors')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (todayResult.error) throw todayResult.error;
  if (totalResult.error) throw totalResult.error;

  return {
    today: todayResult.count ?? 0,
    total: totalResult.count ?? 0,
    day,
  };
}

function unavailableResponse(status = 200) {
  return NextResponse.json({
    available: false,
    today: 0,
    total: 0,
    day: todayKst(),
  }, { status });
}

export async function GET() {
  if (!isUsingSupabaseServiceRole) return unavailableResponse();

  try {
    const stats = await readStats(todayKst());
    return NextResponse.json({ available: true, ...stats });
  } catch {
    return unavailableResponse();
  }
}

export async function POST(req: NextRequest) {
  const cookieId = req.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = isVisitorId(cookieId) ? cookieId : newVisitorId();
  const shouldSetCookie = visitorId !== cookieId;

  if (!isUsingSupabaseServiceRole) {
    const response = unavailableResponse();
    return shouldSetCookie ? withVisitorCookie(response, visitorId) : response;
  }

  try {
    const day = todayKst();

    const visitorInsert = await supabaseServer
      .from('site_visitors')
      .upsert({ id: visitorId }, { onConflict: 'id', ignoreDuplicates: true });
    if (visitorInsert.error) throw visitorInsert.error;

    const dailyInsert = await supabaseServer
      .from('site_daily_visitors')
      .upsert({ day, visitor_id: visitorId }, { onConflict: 'day,visitor_id', ignoreDuplicates: true });
    if (dailyInsert.error) throw dailyInsert.error;

    const stats = await readStats(day);
    const response = NextResponse.json({ available: true, ...stats });
    return shouldSetCookie ? withVisitorCookie(response, visitorId) : response;
  } catch {
    const response = unavailableResponse();
    return shouldSetCookie ? withVisitorCookie(response, visitorId) : response;
  }
}
