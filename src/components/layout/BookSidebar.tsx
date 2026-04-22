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
      <a
        href="https://campusmentor.co.kr/product/2022-%EA%B0%9C%EC%A0%95-%EA%B5%90%EC%9C%A1%EA%B3%BC%EC%A0%95-%EB%B0%98%EC%98%81%ED%95%99%EA%B3%BC%EB%B0%94%EC%9D%B4%EB%B8%94/2510/category/24/display/1/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', flexDirection: 'column', gap: 10, textDecoration: 'none' }}
      >
        <div className="book-img-wrap" style={{
          width: 156, height: 208, borderRadius: 4, overflow: 'hidden',
          position: 'relative',
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
      </a>

      <div style={{
        fontSize: 10, color: '#8B95A1', textAlign: 'center',
        lineHeight: 1.5, padding: '6px 4px',
      }}>
        이 서비스는 도서 수익으로<br/>운영됩니다
      </div>
    </aside>
  );
}
