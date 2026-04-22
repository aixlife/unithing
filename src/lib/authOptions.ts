import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from './supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      // 선생님 upsert
      await supabase.from('teachers').upsert(
        { email: user.email, name: user.name ?? '' },
        { onConflict: 'email' }
      );
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const { data } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email)
          .single();
        if (data) (session.user as { teacherId?: string }).teacherId = data.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
