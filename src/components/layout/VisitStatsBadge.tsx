'use client';

import { useEffect, useState } from 'react';

type VisitStats = {
  available: boolean;
  today: number;
  total: number;
  day: string;
};

function formatCount(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function VisitStatsBadge() {
  const [stats, setStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/visit-stats', {
      method: 'POST',
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('visit stats failed');
        const payload = await res.json() as VisitStats;
        if (!cancelled) setStats(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setStats({ available: false, today: 0, total: 0, day: '' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const title = '실시간 접속 현황';
  const detail = stats?.available
    ? `오늘 ${formatCount(stats.today)}명 · 누적 ${formatCount(stats.total)}명`
    : stats
      ? '집계 준비 중'
      : '확인 중';

  return (
    <aside
      aria-label={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 34,
        borderRadius: 999,
        border: '1px solid #E5E8EB',
        background: '#F8FAFC',
        padding: '0 11px',
        fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{
        fontSize: 11,
        color: '#4E5968',
        fontWeight: 800,
        lineHeight: 1.25,
      }}>
        {title}
      </div>
      <div style={{
        width: 1,
        height: 14,
        background: '#D1D6DB',
      }} />
      <div style={{
        fontSize: 12,
        color: '#191F28',
        fontWeight: 850,
        lineHeight: 1.25,
      }}>
        {detail}
      </div>
    </aside>
  );
}
