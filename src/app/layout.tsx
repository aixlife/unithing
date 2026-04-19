import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UNITHING · 고등학생 생기부 분석 + 진학 도우미',
  description: 'AI가 생기부를 분석하고 진학 준비를 정리해드려요. 무료 통합 플랫폼.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
