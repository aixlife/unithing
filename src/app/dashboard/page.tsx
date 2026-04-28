'use client';
import { useState } from 'react';
import { Service1Grade } from '@/components/services/Service1Grade';
import { Service2Subject } from '@/components/services/Service2Subject';
import { Service3Segibu } from '@/components/services/Service3Segibu';
import { Service4Seteuk } from '@/components/services/Service4Seteuk';
import { Service5Haksaengbu } from '@/components/services/Service5Haksaengbu';
import { Service6Roadmap } from '@/components/services/Service6Roadmap';

const TABS = [
  { id: 3, label: '생기부 분석' },
  { id: 1, label: '대학 찾기' },
  { id: 2, label: '과목 가이드' },
  { id: 4, label: '세특 도우미' },
  { id: 5, label: '학생부 리포트' },
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
        생기부 PDF와 분석 결과는 로그인한 선생님 계정의 학생 데이터에 저장됩니다. 실제 학생 자료는 상담 목적에 필요한 범위에서만 업로드하고, 공유 전 학생 식별 정보와 민감 내용을 다시 확인해 주세요.
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
      {activeTab === 5 && <Service5Haksaengbu />}
      {activeTab === 6 && <Service6Roadmap onOpenService={setActiveTab} />}
    </div>
  );
}
