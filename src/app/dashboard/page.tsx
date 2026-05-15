'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Service1Grade } from '@/components/services/Service1Grade';
import { Service2Subject } from '@/components/services/Service2Subject';
import { Service3Segibu } from '@/components/services/Service3Segibu';
import { Service4Seteuk } from '@/components/services/Service4Seteuk';
import { Service6Roadmap } from '@/components/services/Service6Roadmap';
import { isSegibuAnalysisAllowedEmail } from '@/lib/segibuAccess';

const TABS = [
  { id: 3, label: '생기부 분석' },
  { id: 1, label: '대학 찾기' },
  { id: 2, label: '선택 과목 가이드' },
  { id: 4, label: '세특 도우미' },
  { id: 6, label: '상담 로드맵' },
] as const;

const SEGIBU_NOTICE_STORAGE_KEY = 'unithing.segibuAnalysisNotice.dismissed.v1';

function SegibuUpdateNotice({
  onClose,
}: {
  onClose: (dismissForever: boolean) => void;
}) {
  const [dismissForever, setDismissForever] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="segibu-update-notice-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15, 23, 42, 0.42)',
      }}
    >
      <div
        style={{
          width: 'min(100%, 420px)',
          borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E5E8EB',
          boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)',
          padding: 24,
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        }}
      >
        <div
          id="segibu-update-notice-title"
          style={{ fontSize: 20, fontWeight: 850, color: '#191F28', marginBottom: 8 }}
        >
          생기부 분석은 현재 업데이트중입니다
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#4E5968', lineHeight: 1.7 }}>
          더 안정적인 분석 흐름을 준비하는 동안 생기부 분석 기능은 잠시 닫아두었습니다.
          이용 가능해지면 다시 안내드리겠습니다.
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
            fontSize: 13,
            color: '#4E5968',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={dismissForever}
            onChange={(event) => setDismissForever(event.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#1B64DA' }}
          />
          다시 보지 않기
        </label>

        <button
          onClick={() => onClose(dismissForever)}
          style={{
            width: '100%',
            height: 46,
            marginTop: 18,
            borderRadius: 10,
            border: 'none',
            background: '#1B64DA',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 850,
            cursor: 'pointer',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<number>(1);
  const [showSegibuNotice, setShowSegibuNotice] = useState(false);
  const canUseSegibuAnalysis = isSegibuAnalysisAllowedEmail(session?.user?.email);

  useEffect(() => {
    if (status === 'loading' || canUseSegibuAnalysis) return;

    let timer: number | null = null;
    const openNotice = () => {
      timer = window.setTimeout(() => setShowSegibuNotice(true), 0);
    };

    try {
      if (window.localStorage.getItem(SEGIBU_NOTICE_STORAGE_KEY) !== 'true') {
        openNotice();
      }
    } catch {
      openNotice();
    }

    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [canUseSegibuAnalysis, status]);

  const closeSegibuNotice = (dismissForever: boolean) => {
    if (dismissForever) {
      try {
        window.localStorage.setItem(SEGIBU_NOTICE_STORAGE_KEY, 'true');
      } catch {
        // Ignore storage failures; the notice can still be dismissed for this view.
      }
    }
    setShowSegibuNotice(false);
  };

  const openService = (serviceId: number) => {
    if (serviceId === 3 && !canUseSegibuAnalysis) {
      setShowSegibuNotice(true);
      return;
    }
    setActiveTab(serviceId);
  };

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      {showSegibuNotice && <SegibuUpdateNotice onClose={closeSegibuNotice} />}

      <div style={{
        marginBottom: 14,
        padding: '12px 14px',
        borderRadius: 10,
        background: '#F8FAFC',
        border: '1px solid #E5E8EB',
        color: '#4E5968',
        fontSize: 12.5,
        lineHeight: 1.55,
        fontWeight: 600,
      }}>
        {canUseSegibuAnalysis
          ? '학생 구분명은 실명 대신 번호나 별칭을 권장합니다. 생기부 PDF는 비식별화 확인 후 AI 분석에 사용되며, DB에는 생기부 원문·원문 인용을 제외한 상담 요약과 목표 대학/학과 선택값만 저장합니다.'
          : '학생 구분명은 실명 대신 번호나 별칭을 권장합니다. 생기부 분석은 현재 업데이트중이며, DB에는 생기부 원문·원문 인용을 제외한 상담 요약과 목표 대학/학과 선택값만 저장하는 방향을 유지합니다.'}
      </div>

      {/* Tab navigation */}
      <div className="ut-tabs-scroll" style={{
        display: 'flex', gap: 0,
        borderBottom: '2px solid #E5E8EB',
        marginBottom: 28,
        background: '#fff',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.id === 3 && !canUseSegibuAnalysis;
          const badge = isDisabled ? '업데이트중' : null;
          return (
            <button
              key={tab.id}
              onClick={() => openService(tab.id)}
              aria-disabled={isDisabled}
              style={{
                flex: 1,
                minWidth: isDisabled ? 148 : 106,
                padding: '0 10px',
                height: 58,
                fontSize: 'clamp(14px, 1.3vw, 17px)',
                fontWeight: isActive ? 800 : 500,
                color: isDisabled ? '#8B95A1' : isActive ? '#1B64DA' : '#4E5968',
                background: isDisabled ? '#F8FAFC' : isActive ? '#F0F6FF' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #1B64DA' : '3px solid transparent',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.02em',
                transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              }}
            >
              {tab.label}
              {badge && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 20,
                    marginLeft: 7,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: '#EFF1F4',
                    color: '#6B7684',
                    fontSize: 11,
                    fontWeight: 800,
                    verticalAlign: 'middle',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 1 && <Service1Grade onOpenService={openService} />}
      {activeTab === 2 && <Service2Subject />}
      {activeTab === 3 && canUseSegibuAnalysis && <Service3Segibu />}
      {activeTab === 4 && <Service4Seteuk />}
      {activeTab === 6 && <Service6Roadmap onOpenService={openService} />}
    </div>
  );
}
