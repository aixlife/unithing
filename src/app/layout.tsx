import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://unithing.vercel.app'),
  title: {
    default: 'UNITHING | AI 생기부 분석과 진학 상담',
    template: '%s | UNITHING',
  },
  description: '선생님을 위한 AI 생기부 분석, 대학 찾기, 과목 가이드, 세특 설계, 상담 로드맵 통합 도구.',
  applicationName: 'UNITHING',
  openGraph: {
    title: 'UNITHING | AI 생기부 분석과 진학 상담',
    description: '생기부 분석부터 대학 찾기, 과목 가이드, 세특 설계, 상담 로드맵까지 한 화면에서 정리합니다.',
    url: '/',
    siteName: 'UNITHING',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'UNITHING - AI 생기부 분석과 진학 상담을 한 화면에',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNITHING | AI 생기부 분석과 진학 상담',
    description: '선생님을 위한 AI 생기부 분석과 진학 상담 통합 도구.',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
