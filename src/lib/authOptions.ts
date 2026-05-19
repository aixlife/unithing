import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { buildKakaoTeacherIdentity } from './kakaoIdentity';
import { supabaseServer } from './supabaseServer';

type AuthUserLike = {
  email?: string | null;
  name?: string | null;
};

type AuthAccountLike = {
  provider?: string | null;
  providerAccountId?: string | null;
} | null;

type KakaoProfileLike = {
  id?: string | number | null;
  kakao_account?: {
    email?: string | null;
  };
};

type AuthTokenLike = {
  authProvider?: unknown;
  teacherIdentity?: unknown;
  publicEmail?: unknown;
};

const providers: NextAuthOptions['providers'] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
];

if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  providers.push(
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'profile_nickname',
        },
      },
    }),
  );
}

function normalizeText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getKakaoProfile(profile: unknown): KakaoProfileLike | null {
  if (!profile || typeof profile !== 'object') return null;
  return profile as KakaoProfileLike;
}

function getKakaoAccountId(account: AuthAccountLike, profile: unknown) {
  const fromAccount = normalizeText(account?.providerAccountId);
  if (fromAccount) return fromAccount;

  const profileId = getKakaoProfile(profile)?.id;
  if (typeof profileId === 'number') return String(profileId);
  return normalizeText(profileId);
}

function getKakaoPublicEmail(user: AuthUserLike, profile: unknown) {
  return normalizeText(user.email) ?? normalizeText(getKakaoProfile(profile)?.kakao_account?.email);
}

function getTeacherIdentity(user: AuthUserLike, account: AuthAccountLike, profile?: unknown) {
  if (account?.provider === 'kakao') {
    const kakaoAccountId = getKakaoAccountId(account, profile);
    if (kakaoAccountId) return buildKakaoTeacherIdentity(kakaoAccountId);
    return getKakaoPublicEmail(user, profile);
  }

  return normalizeText(user.email);
}

async function upsertTeacher(identity: string, name?: string | null) {
  return supabaseServer
    .from('teachers')
    .upsert(
      { email: identity, name: name ?? '' },
      { onConflict: 'email' },
    )
    .select('id')
    .single();
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      const teacherIdentity = getTeacherIdentity(user, account, profile);
      if (!teacherIdentity) return false;

      await upsertTeacher(teacherIdentity, user.name);
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        const teacherIdentity = getTeacherIdentity(user, account, profile);
        const publicEmail = account.provider === 'kakao'
          ? getKakaoPublicEmail(user, profile)
          : normalizeText(user.email);

        if (teacherIdentity) token.teacherIdentity = teacherIdentity;
        if (account.provider) token.authProvider = account.provider;
        token.publicEmail = publicEmail;
      }

      return token;
    },
    async session({ session, token }) {
      const authToken = token as AuthTokenLike;
      const teacherIdentity = normalizeText(authToken.teacherIdentity) ?? normalizeText(session.user?.email);

      if (session.user && authToken.authProvider === 'kakao') {
        session.user.email = normalizeText(authToken.publicEmail);
      }

      if (session.user && teacherIdentity) {
        const { data: existingTeacher } = await supabaseServer
          .from('teachers')
          .select('id')
          .eq('email', teacherIdentity)
          .single();

        if (existingTeacher) {
          (session.user as { teacherId?: string }).teacherId = existingTeacher.id;
        } else {
          const { data } = await upsertTeacher(teacherIdentity, session.user.name);
          if (data) (session.user as { teacherId?: string }).teacherId = data.id;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
