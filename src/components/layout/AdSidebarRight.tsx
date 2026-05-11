import Image from 'next/image';

export function AdSidebarRight() {
  return (
    <aside className="ut-sidebar" style={{
      width: 'clamp(150px, 14vw, 190px)', flexShrink: 0, padding: '24px 12px',
      display: 'flex', flexDirection: 'column', gap: 16,
      borderLeft: '1px solid #E5E8EB',
      background: '#fff',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        color: '#8B95A1', textAlign: 'center', textTransform: 'uppercase',
      }}>
        Sponsored
      </div>

      <a
        href="https://www.youtube.com/@%EB%8C%80%ED%95%99%EB%9D%B5"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: '100%',
          maxWidth: 156,
          alignSelf: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          textDecoration: 'none',
        }}
      >
        <div className="book-img-wrap" style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
          background: '#F8FAFC',
          border: '1px solid #E5E8EB',
        }}>
          <Image
            src="/sponsor-daehakdding.png"
            alt="대학띵 유튜브 채널"
            fill
            style={{ objectFit: 'contain' }}
            sizes="156px"
          />
        </div>
        <div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#191F28',
            lineHeight: 1.4,
            letterSpacing: 0,
          }}>
            대학띵
          </div>
          <div style={{ fontSize: 11, color: '#4E5968', marginTop: 2 }}>
            유튜브 채널
          </div>
        </div>
      </a>
    </aside>
  );
}
