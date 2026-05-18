import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

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
    .rpc('get_site_visit_stats', { visit_day: day })
    .single();

  if (error) throw error;
  return rowToStats(data as VisitStatsRow | null, day);
}

async function recordVisit(visitorId: string, day: string) {
  const { data, error } = await supabaseServer
    .rpc('record_site_visit', { visitor_id: visitorId, visit_day: day })
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

export async function GET() {
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

  try {
    const day = todayKst();
    const stats = await recordVisit(visitorId, day);
    const response = NextResponse.json({ available: true, ...stats });
    return shouldSetCookie ? withVisitorCookie(response, visitorId) : response;
  } catch {
    const response = unavailableResponse();
    return shouldSetCookie ? withVisitorCookie(response, visitorId) : response;
  }
}
