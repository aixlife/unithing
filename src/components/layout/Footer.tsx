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
      <span>
        UNITHING 운영: CAMPUS MENTOR · 통합 개발: AIXLIFE · 기획 및 개발 기반: 김강석 선생님
      </span>
      {showErrorReport && <ErrorReportButton />}
    </footer>
  );
}
