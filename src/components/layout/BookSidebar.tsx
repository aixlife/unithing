import Image from 'next/image';

export function BookSidebar() {
  return (
    <aside className="ut-sidebar" style={{
      width: 'clamp(150px, 14vw, 190px)', flexShrink: 0, padding: '24px 12px',
      display: 'flex', flexDirection: 'column', gap: 16,
      borderRight: '1px solid #E5E8EB',
      background: '#fff',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        color: '#8B95A1', textAlign: 'center', textTransform: 'uppercase',
      }}>
        Sponsored
      </div>

      {/* 학과 바이블 — 실제 도서 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          width: 156, height: 208, borderRadius: 4, overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', position: 'relative',
        }}>
          <Image
            src="/book-hakgwa-bible.jpeg"
            alt="학과바이블"
            fill
            style={{ objectFit: 'cover' }}
            sizes="156px"
          />
        </div>
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700, color: '#191F28',
            lineHeight: 1.4, letterSpacing: '-0.02em',
          }}>학과바이블</div>
          <div style={{ fontSize: 11, color: '#4E5968', marginTop: 2 }}>계열별 학과 백과</div>
        </div>
        <a
          href="https://www.campusmentor.co.kr"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', padding: '8px 10px', fontSize: 12, fontWeight: 700,
            background: 'transparent', color: '#191F28',
            border: '1px solid #D1D6DB', borderRadius: 8,
            textAlign: 'center', cursor: 'pointer',
          }}
        >
          구매하기
        </a>
      </div>

      <div style={{
        fontSize: 10, color: '#8B95A1', textAlign: 'center',
        lineHeight: 1.5, padding: '6px 4px',
      }}>
        이 서비스는 도서 수익으로<br/>운영됩니다
      </div>
    </aside>
  );
}
