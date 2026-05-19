import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { buildKakaoTeacherIdentity } from '@/lib/kakaoIdentity';
import { isUsingSupabaseServiceRole, supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

type KakaoUnlinkPayload = {
  app_id?: string | null;
  user_id?: string | null;
  referrer_type?: string | null;
};

function okResponse() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

function normalizeText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(req: NextRequest) {
  const adminKey = process.env.KAKAO_ADMIN_KEY;
  if (!adminKey) return false;

  const authorization = req.headers.get('authorization') ?? '';
  const prefix = 'KakaoAK ';
  if (!authorization.startsWith(prefix)) return false;

  return safeEqual(authorization.slice(prefix.length).trim(), adminKey);
}

function isExpectedApp(appId: string | null) {
  const expectedAppId = process.env.KAKAO_APP_ID;
  if (!expectedAppId || !appId) return false;
  return safeEqual(appId, expectedAppId);
}

function payloadFromParams(params: URLSearchParams): KakaoUnlinkPayload {
  return {
    app_id: normalizeText(params.get('app_id')),
    user_id: normalizeText(params.get('user_id')),
    referrer_type: normalizeText(params.get('referrer_type')),
  };
}

async function payloadFromRequest(req: NextRequest) {
  const rawBody = await req.text();
  if (!rawBody.trim()) return {};

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    return {
      app_id: normalizeText(body.app_id),
      user_id: normalizeText(body.user_id),
      referrer_type: normalizeText(body.referrer_type),
    };
  }

  return payloadFromParams(new URLSearchParams(rawBody));
}

async function deleteKakaoTeacher(identity: string) {
  const { data: teacher, error: lookupError } = await supabaseServer
    .from('teachers')
    .select('id')
    .eq('email', identity)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!teacher?.id) return 'not_found';

  const { error: deleteError } = await supabaseServer
    .from('teachers')
    .delete()
    .eq('id', teacher.id);

  if (deleteError) throw deleteError;
  return 'deleted';
}

async function handleUnlinkWebhook(req: NextRequest, payload: KakaoUnlinkPayload) {
  const appId = normalizeText(payload.app_id);
  const userId = normalizeText(payload.user_id);
  const referrerType = normalizeText(payload.referrer_type);

  if (!isUsingSupabaseServiceRole) {
    console.warn('kakao unlink webhook ignored: SUPABASE_SERVICE_ROLE_KEY is not configured');
    return okResponse();
  }

  if (!process.env.KAKAO_ADMIN_KEY || !process.env.KAKAO_APP_ID) {
    console.warn('kakao unlink webhook ignored: KAKAO_ADMIN_KEY or KAKAO_APP_ID is not configured');
    return okResponse();
  }

  if (!isAuthorized(req) || !isExpectedApp(appId)) {
    console.warn('kakao unlink webhook ignored: authorization or app_id mismatch', { referrerType });
    return okResponse();
  }

  const identity = buildKakaoTeacherIdentity(userId);
  if (!identity) {
    console.warn('kakao unlink webhook ignored: missing user_id', { referrerType });
    return okResponse();
  }

  try {
    const result = await deleteKakaoTeacher(identity);
    console.info('kakao unlink webhook handled', { result, referrerType });
  } catch (error) {
    console.error('kakao unlink webhook delete failed', error);
  }

  return okResponse();
}

export async function GET(req: NextRequest) {
  return handleUnlinkWebhook(req, payloadFromParams(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  try {
    return handleUnlinkWebhook(req, await payloadFromRequest(req));
  } catch (error) {
    console.error('kakao unlink webhook parse failed', error);
    return okResponse();
  }
}
