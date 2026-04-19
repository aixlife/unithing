'use client';
import { useState } from 'react';
import Link from 'next/link';

function UnithingLogo({ size = 28 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: '#1B64DA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 20 20" fill="none">
        <path d="M5 4v7.2a5 5 0 0 0 10 0V4" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

export function Header({ userName = '김지우' }: { userName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      height: 64, background: '#fff',
      borderBottom: '1px solid #E5E8EB',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px, 3vw, 28px)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UnithingLogo size={28} />
        <span style={{
          fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: '#191F28', lineHeight: 1,
        }}>UNITHING</span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a className="ut-desktop-only" style={{ fontSize: 14, color: '#4E5968', fontWeight: 500, cursor: 'pointer' }}>유니띵 소개</a>
        <a className="ut-desktop-only" style={{ fontSize: 14, color: '#4E5968', fontWeight: 500, cursor: 'pointer' }}>도서 구매</a>
        <div className="ut-desktop-only" style={{ width: 1, height: 16, background: '#E5E8EB' }} />
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#EFF1F4', color: '#4E5968',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, border: '1px solid #E5E8EB',
            }}>
              {userName.slice(-1)}
            </div>
            <span style={{ fontSize: 14, color: '#191F28', fontWeight: 600 }}>{userName}</span>
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M1 3l6 6 6-6" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', border: '1px solid #E5E8EB', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 140, overflow: 'hidden',
            }}>
              <Link href="/login" style={{
                display: 'block', padding: '12px 16px', fontSize: 14, color: '#DC2626', fontWeight: 600,
              }}>
                로그아웃
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
