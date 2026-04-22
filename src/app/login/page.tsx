'use client';
import { signIn } from 'next-auth/react';

function GoogleIcon() {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: '50%', background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width="14" height="14" viewBox="0 0 48 48" aria-label="Google">
        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
    </span>
  );
}

function UnithingLogo({ size = 44 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: '#1B64DA', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 20 20" fill="none">
        <path d="M5 4v7.2a5 5 0 0 0 10 0V4" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#F4F6F8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40,
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#fff', borderRadius: 20, padding: '44px 44px 36px',
        border: '1px solid #E5E8EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ marginBottom: 36 }}>
          <UnithingLogo size={44} />
          <div style={{
            fontSize: 24, fontWeight: 800, color: '#191F28',
            letterSpacing: '-0.035em', marginTop: 20, lineHeight: 1.25,
          }}>
            생기부, AI가 분석해<br/>진학 준비를 정리해드려요.
          </div>
          <div style={{
            fontSize: 14, color: '#4E5968', fontWeight: 500,
            marginTop: 10, letterSpacing: '-0.01em', lineHeight: 1.55,
          }}>
            로그인하고 무료로 시작하세요.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} style={{
            height: 52, borderRadius: 10,
            background: '#191F28', color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            letterSpacing: '-0.01em', cursor: 'pointer', width: '100%',
          }}>
            <GoogleIcon />
            Google로 시작하기
          </button>

          {/* Kakao */}
          <button style={{
            height: 52, borderRadius: 10,
            background: '#FEE500', color: '#181600',
            border: 'none', fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer', letterSpacing: '-0.01em',
          }}>
            카카오로 시작하기
          </button>
        </div>

        <div style={{
          marginTop: 28, padding: '14px 16px', borderRadius: 10,
          background: '#EFF1F4', border: '1px solid #E5E8EB',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 4, letterSpacing: '-0.01em' }}>
            처음 오셨나요?
          </div>
          <div style={{ fontSize: 12.5, color: '#4E5968', lineHeight: 1.6 }}>
            별도 가입 절차 없이 소셜 계정으로 바로 시작할 수 있어요. 모든 기능 무료입니다.
          </div>
        </div>

        <div style={{
          marginTop: 28, textAlign: 'center',
          fontSize: 11.5, color: '#8B95A1', lineHeight: 1.7, letterSpacing: '-0.01em',
        }}>
          가입 시{' '}
          <a style={{ color: '#4E5968', textDecoration: 'underline', cursor: 'pointer' }}>서비스 이용약관</a>과{' '}
          <a style={{ color: '#4E5968', textDecoration: 'underline', cursor: 'pointer' }}>개인정보처리방침</a>에 동의하게 됩니다.<br/>
          운영: 캠퍼스멘토
        </div>
      </div>
    </div>
  );
}
