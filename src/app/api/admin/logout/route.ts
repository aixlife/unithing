import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, revokeAdminSession } from '@/lib/adminAuth';

export async function POST() {
  const cookieStore = await cookies();
  await revokeAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
