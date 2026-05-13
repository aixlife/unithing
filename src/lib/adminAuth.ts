import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { isUsingSupabaseServiceRole, supabaseServer } from './supabaseServer';

export const ADMIN_COOKIE_NAME = 'unithing_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

function getAdminSecret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

export function isAdminConfigured() {
  return Boolean(process.env.UNITHING_ADMIN_PASSWORD && getAdminSecret() && isUsingSupabaseServiceRole);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminPassword(password: string) {
  const configured = process.env.UNITHING_ADMIN_PASSWORD;
  if (!configured) return false;
  return safeEqual(password, configured);
}

function sign(value: string) {
  return createHmac('sha256', getAdminSecret()).update(value).digest('hex');
}

export async function createAdminSessionToken(clientHint: string) {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE * 1000).toISOString();
  const { error } = await supabaseServer
    .from('admin_sessions')
    .insert({
      id,
      expires_at: expiresAt,
      client_hint: clientHint.slice(0, 200),
    });
  if (error) throw new Error(`admin session create failed: ${error.message}`);
  return `${id}.${sign(id)}`;
}

export async function verifyAdminSessionToken(token?: string) {
  if (!token || !getAdminSecret()) return false;
  const [id, signature] = token.split('.');
  if (!id || !signature) return false;
  if (!safeEqual(signature, sign(id))) return false;

  const { data, error } = await supabaseServer
    .from('admin_sessions')
    .select('expires_at, revoked_at')
    .eq('id', id)
    .single();
  if (error || !data?.expires_at || data.revoked_at) return false;
  return new Date(data.expires_at).getTime() > Date.now();
}

export async function revokeAdminSession(token?: string) {
  if (!token || !getAdminSecret()) return;
  const [id, signature] = token.split('.');
  if (!id || !signature || !safeEqual(signature, sign(id))) return;
  await supabaseServer
    .from('admin_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
