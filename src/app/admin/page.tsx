'use client';

import { Copy, LogOut, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Footer } from '@/components/layout/Footer';

type ErrorReport = {
  id: string;
  created_at: string;
  status: string;
  reporter_email: string | null;
  page_path: string | null;
  service_label: string | null;
  visible_error: string | null;
  user_note: string | null;
  user_agent: string | null;
  mail_status: string | null;
  mail_error: string | null;
  admin_note: string;
  developer_copy: string;
};

const STATUS_OPTIONS = [
  { value: 'new', label: '신규' },
  { value: 'in_progress', label: '처리중' },
  { value: 'done', label: '완료' },
  { value: 'deferred', label: '보류' },
] as const;

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingReportId, setSavingReportId] = useState<string | null>(null);

  const newest = useMemo(() => reports[0], [reports]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/error-reports', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthenticated(false);
        setReports([]);
        return;
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? '오류 리포트를 불러오지 못했습니다.');
        return;
      }
      const payload = await res.json();
      const nextReports = (payload.reports ?? []) as ErrorReport[];
      setReports(nextReports);
      setDraftNotes(Object.fromEntries(nextReports.map((report) => [report.id, report.admin_note ?? ''])));
      setAuthenticated(true);
    } catch {
      setError('네트워크 문제로 오류 리포트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadReports);
  }, [loadReports]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? '관리자 로그인을 실패했습니다.');
        return;
      }
      setPassword('');
      await loadReports();
    } catch {
      setError('네트워크 문제로 관리자 로그인을 완료하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setReports([]);
  };

  const copyReport = async (report: ErrorReport) => {
    try {
      await navigator.clipboard.writeText(report.developer_copy);
      setCopiedId(report.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError('브라우저 권한 문제로 복사하지 못했습니다. HTTPS 환경에서 다시 시도해 주세요.');
    }
  };

  const updateReport = async (id: string, patch: { status?: string; adminNote?: string }) => {
    setSavingReportId(id);
    setError('');
    try {
      const res = await fetch('/api/admin/error-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? '처리 상태를 저장하지 못했습니다.');
        return;
      }
      const payload = await res.json();
      const updated = payload.report as ErrorReport;
      setReports(prev => prev.map(report => report.id === updated.id ? updated : report));
      setDraftNotes(prev => ({ ...prev, [updated.id]: updated.admin_note ?? '' }));
    } catch {
      setError('네트워크 문제로 처리 상태를 저장하지 못했습니다.');
    } finally {
      setSavingReportId(null);
    }
  };

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F6F8' }}>
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <form onSubmit={login} style={{
            width: 'min(420px, 100%)',
            background: '#fff',
            border: '1px solid #E5E8EB',
            borderRadius: 14,
            padding: 28,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <ShieldCheck size={24} color="#1B64DA" />
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#191F28' }}>관리자 로그인</h1>
                <p style={{ marginTop: 4, fontSize: 13, color: '#6B7684' }}>오류 보고 내역은 관리자만 확인할 수 있습니다.</p>
              </div>
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="관리자 비밀번호"
              style={{
                width: '100%',
                height: 46,
                border: '1px solid #D1D6DB',
                borderRadius: 9,
                padding: '0 13px',
                fontSize: 15,
                outlineColor: '#1B64DA',
              }}
            />
            {error && <div style={{ marginTop: 12, color: '#B42318', fontSize: 13, lineHeight: 1.5 }}>{error}</div>}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                height: 46,
                marginTop: 16,
                border: 'none',
                borderRadius: 9,
                background: loading || !password ? '#B8C7E7' : '#1B64DA',
                color: '#fff',
                fontSize: 15,
                fontWeight: 800,
                cursor: loading || !password ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '확인 중' : '로그인'}
            </button>
          </form>
        </main>
        <Footer showErrorReport={false} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F6F8' }}>
      <main style={{ flex: 1, background: '#F4F6F8', padding: '28px clamp(18px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 18 }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, color: '#6B7684', fontWeight: 800 }}>UNITHING Admin</div>
              <h1 style={{ marginTop: 4, fontSize: 30, lineHeight: 1.2, fontWeight: 900, color: '#191F28' }}>오류 보고함</h1>
              <p style={{ marginTop: 8, color: '#4E5968', fontSize: 15 }}>
                최근 {reports.length}건을 표시합니다. 복사 버튼으로 AI 개발자에게 전달할 수 있는 비식별 요약을 복사합니다.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={loadReports} disabled={loading} style={toolbarButtonStyle}>
                <RefreshCw size={16} />
                새로고침
              </button>
              <button onClick={logout} style={toolbarButtonStyle}>
                <LogOut size={16} />
                로그아웃
              </button>
            </div>
          </header>

          {error && <div style={{ color: '#B42318', background: '#FEE4E2', border: '1px solid #FECDCA', borderRadius: 10, padding: 12 }}>{error}</div>}

          {newest && (
            <section style={{
              background: '#fff',
              border: '1px solid #E5E8EB',
              borderRadius: 12,
              padding: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 13, color: '#6B7684', fontWeight: 900 }}>최근 접수</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: '#191F28' }}>
                {newest.service_label || newest.page_path || newest.id}
              </div>
              <p style={{ marginTop: 8, color: '#4E5968', lineHeight: 1.6 }}>{newest.visible_error || newest.user_note || '-'}</p>
            </section>
          )}

          <section style={{ display: 'grid', gap: 12 }}>
            {reports.length === 0 && !loading && (
              <div style={{ background: '#fff', border: '1px solid #E5E8EB', borderRadius: 12, padding: 24, color: '#6B7684' }}>
                아직 접수된 오류 보고가 없습니다.
              </div>
            )}
            {reports.map((report) => (
              <article key={report.id} style={{
                background: '#fff',
                border: '1px solid #E5E8EB',
                borderRadius: 12,
                padding: 18,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 14,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={pillStyle}>{report.status}</span>
                    <span style={pillStyle}>mail: {report.mail_status || '-'}</span>
                    <span style={{ fontSize: 12, color: '#8B95A1' }}>{new Date(report.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <h2 style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: '#191F28' }}>
                    {report.service_label || report.page_path || '서비스 미상'}
                  </h2>
                  <div style={{ marginTop: 6, fontSize: 13, color: '#6B7684' }}>{report.page_path || '-'}</div>
                  <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.65, color: '#333D4B', whiteSpace: 'pre-wrap' }}>
                    {report.visible_error || report.user_note || '-'}
                  </p>
                  {report.mail_error && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#B42318' }}>메일 알림 실패: {report.mail_error}</div>
                  )}
                </div>
                <button onClick={() => copyReport(report)} style={{
                  ...toolbarButtonStyle,
                  alignSelf: 'start',
                  color: copiedId === report.id ? '#067647' : '#333D4B',
                }}>
                  <Copy size={16} />
                  {copiedId === report.id ? '복사됨' : '복사'}
                </button>
                <div style={{ display: 'grid', gridColumn: '1 / -1', gridTemplateColumns: '170px minmax(0, 1fr) auto', gap: 8, alignItems: 'start' }}>
                  <select
                    value={report.status}
                    disabled={savingReportId === report.id}
                    onChange={(event) => void updateReport(report.id, { status: event.target.value, adminNote: draftNotes[report.id] ?? '' })}
                    style={{
                      height: 38,
                      borderRadius: 8,
                      border: '1px solid #D1D6DB',
                      background: '#F8FAFC',
                      color: '#191F28',
                      fontSize: 13,
                      fontWeight: 800,
                      padding: '0 10px',
                    }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <textarea
                    value={draftNotes[report.id] ?? ''}
                    disabled={savingReportId === report.id}
                    onChange={(event) => setDraftNotes(prev => ({ ...prev, [report.id]: event.target.value }))}
                    placeholder="처리 메모"
                    rows={2}
                    style={{
                      resize: 'vertical',
                      minHeight: 38,
                      borderRadius: 8,
                      border: '1px solid #D1D6DB',
                      padding: '8px 10px',
                      color: '#191F28',
                      fontSize: 13,
                      lineHeight: 1.45,
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => void updateReport(report.id, { adminNote: draftNotes[report.id] ?? '', status: report.status })}
                    disabled={savingReportId === report.id}
                    style={{
                      ...toolbarButtonStyle,
                      minWidth: 86,
                      opacity: savingReportId === report.id ? 0.65 : 1,
                    }}
                  >
                    <Save size={16} />
                    저장
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
      <Footer showErrorReport={false} />
    </div>
  );
}

const toolbarButtonStyle: CSSProperties = {
  minHeight: 38,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  border: '1px solid #D1D6DB',
  borderRadius: 9,
  background: '#fff',
  color: '#333D4B',
  padding: '0 12px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 24,
  borderRadius: 999,
  padding: '0 9px',
  background: '#EFF4FF',
  color: '#175CD3',
  fontSize: 12,
  fontWeight: 900,
};
