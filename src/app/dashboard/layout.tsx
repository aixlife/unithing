import { Header } from '@/components/layout/Header';
import { BookSidebar } from '@/components/layout/BookSidebar';
import { AdSidebarRight } from '@/components/layout/AdSidebarRight';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F6F8' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', width: '100%' }}>
        <BookSidebar />
        <main style={{ flex: 1, minWidth: 0, padding: 'clamp(16px, 3vw, 28px) clamp(16px, 2.5vw, 24px)' }}>
          {children}
        </main>
        <AdSidebarRight />
      </div>
    </div>
  );
}
