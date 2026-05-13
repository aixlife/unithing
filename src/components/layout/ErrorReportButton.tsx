'use client';

import { AlertTriangle, Send, X } from 'lucide-react';
import { useState } from 'react';

type Status = 'idle' | 'sending' | 'done' | 'error';

export function ErrorReportButton() {
  const [open, setOpen] = useState(false);
  const [visibleError, setVisibleError] = useState('');
  const [userNote, setUserNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const submit = async () => {
    setStatus('sending');
    setMessage('');
    const res = await fetch('/api/error-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: window.location.pathname,
        serviceLabel: document.title,
        visibleError,
        userNote,
        clientContext: {
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          devicePixelRatio: window.devicePixelRatio,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          reportedAt: new Date().toISOString(),
        },
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setStatus('error');
      setMessage(payload?.error ?? '오류 보고를 저장하지 못했습니다.');
      return;
    }

    const payload = await res.json();
    setStatus('done');
    setMessage(`접수되었습니다. ID: ${payload.reportId}`);
    setVisibleError('');
    setUserNote('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setStatus('idle');
          setMessage('');
        }}
        className="no-print"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          border: '1px solid #D1D6DB',
          background: '#fff',
          color: '#4E5968',
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <AlertTriangle size={14} />
        오류 보고
      </button>

      {open && (
        <div
          className="no-print"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(25,31,40,0.42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
          }}
        >
          <div style={{
            width: 'min(520px, 100%)',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E5E8EB',
            boxShadow: '0 18px 50px rgba(0,0,0,0.22)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px',
              borderBottom: '1px solid #E5E8EB',
            }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#191F28' }}>오류 보고</div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: '#6B7684', lineHeight: 1.5 }}>
                  학생 원문, PDF 원본, 주민번호, 연락처, API 키는 넣지 말아주세요.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                style={{
                  width: 34,
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 8,
                  background: '#F2F4F6',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#333D4B' }}>화면에 보인 오류</span>
                <textarea
                  value={visibleError}
                  onChange={(event) => setVisibleError(event.target.value)}
                  placeholder="예: 분석 중 413 오류가 표시됨"
                  rows={3}
                  style={{
                    resize: 'vertical',
                    border: '1px solid #D1D6DB',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    lineHeight: 1.55,
                    outlineColor: '#1B64DA',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#333D4B' }}>추가 메모</span>
                <textarea
                  value={userNote}
                  onChange={(event) => setUserNote(event.target.value)}
                  placeholder="무엇을 누른 직후였는지, 재현 순서를 적어주세요."
                  rows={5}
                  style={{
                    resize: 'vertical',
                    border: '1px solid #D1D6DB',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    lineHeight: 1.55,
                    outlineColor: '#1B64DA',
                  }}
                />
              </label>

              {message && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: status === 'error' ? '#B42318' : '#067647',
                  background: status === 'error' ? '#FEE4E2' : '#DCFAE6',
                  border: `1px solid ${status === 'error' ? '#FECDCA' : '#ABEFC6'}`,
                }}>
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={status === 'sending' || (!visibleError.trim() && !userNote.trim())}
                style={{
                  height: 44,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  border: 'none',
                  borderRadius: 9,
                  background: status === 'sending' || (!visibleError.trim() && !userNote.trim()) ? '#B8C7E7' : '#1B64DA',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: status === 'sending' || (!visibleError.trim() && !userNote.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={16} />
                {status === 'sending' ? '전송 중' : '오류 보고 보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
