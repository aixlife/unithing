'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useStudent } from '@/contexts/StudentContext';
import { Student } from '@/lib/supabase';
import { StudentModal } from '@/components/students/StudentModal';

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

function StudentSelector() {
  const { students, currentStudent, setCurrentStudent } = useStudent();
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#F4F6F8', border: '1px solid #E5E8EB', borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#191F28',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#4E5968" strokeWidth="2"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#4E5968" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {currentStudent ? currentStudent.name : '학생 선택'}
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path d="M1 3l6 6 6-6" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            background: '#fff', border: '1px solid #E5E8EB', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: 180, overflow: 'hidden', zIndex: 200,
          }}>
            {students.length === 0 && (
              <p style={{ padding: '12px 14px', fontSize: 13, color: '#8B95A1', margin: 0 }}>등록된 학생 없음</p>
            )}
            {students.map((s: Student) => (
              <button key={s.id} onClick={() => { setCurrentStudent(s); setOpen(false); }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', fontSize: 13, fontWeight: 600,
                background: currentStudent?.id === s.id ? '#EEF4FF' : 'transparent',
                color: currentStudent?.id === s.id ? '#1B64DA' : '#191F28',
                border: 'none', cursor: 'pointer',
              }}>
                {s.name}
                <span style={{ fontSize: 11, color: '#8B95A1', marginLeft: 6, fontWeight: 400 }}>{s.grade}</span>
              </button>
            ))}
            <div style={{ borderTop: '1px solid #F4F6F8' }}>
              <button onClick={() => { setOpen(false); setShowModal(true); }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1B64DA',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}>+ 학생 등록</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <StudentModal onClose={() => setShowModal(false)} />}
    </>
  );
}

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const userName = session?.user?.name ?? '';

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

      <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StudentSelector />
        <div style={{ width: 1, height: 16, background: '#E5E8EB' }} />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#EFF1F4', color: '#4E5968',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, border: '1px solid #E5E8EB',
            }}>
              {userName.slice(-1)}
            </div>
            <span className="ut-desktop-only" style={{ fontSize: 14, color: '#191F28', fontWeight: 600 }}>{userName}</span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', border: '1px solid #E5E8EB', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 140, overflow: 'hidden',
            }}>
              <button onClick={() => signOut({ callbackUrl: '/login' })} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 16px', fontSize: 14, color: '#DC2626', fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}>로그아웃</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
