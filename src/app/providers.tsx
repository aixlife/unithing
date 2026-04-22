'use client';
import { SessionProvider } from 'next-auth/react';
import { StudentProvider } from '@/contexts/StudentContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StudentProvider>{children}</StudentProvider>
    </SessionProvider>
  );
}
