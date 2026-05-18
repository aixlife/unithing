'use client';

import { useSession } from 'next-auth/react';
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

function getDetail(status: ReturnType<typeof useSession>['status'], stats: VisitStats | null) {
  if (status === 'loading') return '로그인 확인 중';
  if (status !== 'authenticated') return '로그인 후 집계';
  if (!stats) return '확인 중';
  if (!stats.available) return '집계 준비 중';
  return `오늘 ${formatCount(stats.today)}명 · 누적 ${formatCount(stats.total)}명`;
}

export function VisitStatsBadge() {
  const { status } = useSession();
  const [stats, setStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    let cancelled = false;

    fetch('/api/visit-stats', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
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
  }, [status]);

  const visibleStats = status === 'authenticated' ? stats : null;
  const title = '실시간 접속 현황';
  const detail = getDetail(status, visibleStats);

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
