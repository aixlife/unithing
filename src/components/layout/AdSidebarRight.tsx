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
    </aside>
  );
}
