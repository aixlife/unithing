import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from '@/lib/adminAuth';

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkAttemptLimit(key: string) {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }
  return bucket.count < MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  bucket.count += 1;
  attempts.set(key, bucket);
}

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return Response.json({
      error: '관리자 기능을 사용하려면 UNITHING_ADMIN_PASSWORD, ADMIN_SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.',
    }, { status: 503 });
  }

  const clientKey = getClientKey(req);
  if (!checkAttemptLimit(clientKey)) {
    return Response.json({ error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as { password?: string };
  if (!verifyAdminPassword(body.password ?? '')) {
    recordFailedAttempt(clientKey);
    return Response.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }
  attempts.delete(clientKey);

  let token: string;
  try {
    token = await createAdminSessionToken(clientKey);
  } catch {
    return Response.json({ error: '관리자 세션을 만들지 못했습니다. Supabase 마이그레이션 적용 여부를 확인해 주세요.' }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return res;
}
