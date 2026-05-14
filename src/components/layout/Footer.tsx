'use client';

import { ErrorReportButton } from './ErrorReportButton';

type FooterProps = {
  showErrorReport?: boolean;
};

export function Footer({ showErrorReport = true }: FooterProps) {
  return (
    <footer
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '12px clamp(16px, 2.5vw, 28px)',
        borderTop: '1px solid #E5E8EB',
        background: '#FFFFFF',
        color: '#6B7684',
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>
          (주)커몬컴퍼니 | 총괄책임자 : 이동준 | 통합개발 : AIXLIFE | 기획 : 담당자 | 문의 : comeon1113@gmail.com
        </span>
        <span>Copyright © 2026 ComeonCompany. All rights reserved.</span>
      </div>
      {showErrorReport && <ErrorReportButton />}
    </footer>
  );
}
