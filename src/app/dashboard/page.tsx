'use client';
import { useState } from 'react';
import { Service1Grade } from '@/components/services/Service1Grade';
import { Service2Subject } from '@/components/services/Service2Subject';
import { Service3Segibu } from '@/components/services/Service3Segibu';
import { Service4Seteuk } from '@/components/services/Service4Seteuk';
import { Service6Roadmap } from '@/components/services/Service6Roadmap';

const TABS = [
  { id: 3, label: '생기부 분석' },
  { id: 1, label: '대학 찾기' },
  { id: 2, label: '과목 가이드' },
  { id: 4, label: '세특 도우미' },
  { id: 6, label: '상담 로드맵' },
] as const;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<number>(3);

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
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
        학생 구분명은 실명 대신 번호나 별칭을 권장합니다. 생기부 PDF는 비식별화 확인 후 AI 분석에 사용되며, DB에는 생기부 원문·원문 인용을 제외한 상담 요약과 목표 대학/학과 선택값만 저장합니다.
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
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: 0,
                height: 58,
                fontSize: 'clamp(14px, 1.3vw, 17px)',
                fontWeight: isActive ? 800 : 500,
                color: isActive ? '#1B64DA' : '#4E5968',
                background: isActive ? '#F0F6FF' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #1B64DA' : '3px solid transparent',
                cursor: 'pointer',
                letterSpacing: '-0.02em',
                transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 1 && <Service1Grade onOpenService={setActiveTab} />}
      {activeTab === 2 && <Service2Subject />}
      {activeTab === 3 && <Service3Segibu />}
      {activeTab === 4 && <Service4Seteuk />}
      {activeTab === 6 && <Service6Roadmap onOpenService={setActiveTab} />}
    </div>
  );
}
