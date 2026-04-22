'use client';
import { useState, useRef } from 'react';
import { useStudent } from '@/contexts/StudentContext';

const GRADES = ['1학년', '2학년', '3학년'];

export function StudentModal({ onClose }: { onClose: () => void }) {
  const { addStudent, analyzeSegibu } = useStudent();
  const [form, setForm] = useState({ name: '', grade: '1학년', school: '', target_dept: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [step, setStep] = useState<'idle' | 'saving' | 'analyzing'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const loading = step !== 'idle';

  const submit = async () => {
    if (!form.name.trim() || loading) return;
    setStep('saving');
    const newStudent = await addStudent({ ...form, naesin_data: null, segibu_pdf_url: null });
    if (pdfFile && newStudent) {
      setStep('analyzing');
      await analyzeSegibu(pdfFile, newStudent);
    }
    onClose();
  };

  const btnLabel = step === 'saving' ? '저장 중...' : step === 'analyzing' ? '분석 중...' : '등록';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={loading ? undefined : onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        width: 400, boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191F28', margin: '0 0 20px' }}>학생 등록</h2>

        {[
          { label: '이름', key: 'name', placeholder: '홍길동' },
          { label: '학교', key: 'school', placeholder: '○○고등학교' },
          { label: '희망 학과', key: 'target_dept', placeholder: '컴퓨터공학과' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4E5968', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input
              value={form[f.key as keyof typeof form]}
              onChange={e => handle(f.key, e.target.value)}
              placeholder={f.placeholder}
              disabled={loading}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid #D1D5DB', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', background: loading ? '#F9FAFB' : '#fff',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4E5968', display: 'block', marginBottom: 6 }}>학년</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {GRADES.map(g => (
              <button key={g} onClick={() => handle('grade', g)} disabled={loading} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                border: form.grade === g ? '2px solid #1B64DA' : '1px solid #D1D5DB',
                background: form.grade === g ? '#EEF4FF' : '#fff',
                color: form.grade === g ? '#1B64DA' : '#4E5968',
              }}>{g}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4E5968', display: 'block', marginBottom: 6 }}>
            생기부 PDF
            <span style={{ fontWeight: 400, color: '#8B95A1', marginLeft: 6 }}>선택 — 등록과 동시에 분석</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
          />
          <div
            onClick={() => !loading && fileRef.current?.click()}
            style={{
              border: `1px dashed ${pdfFile ? '#1B64DA' : '#D1D5DB'}`,
              borderRadius: 8, padding: '11px 14px', cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              background: pdfFile ? '#F0F5FF' : '#FAFAFA',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke={pdfFile ? '#1B64DA' : '#8B95A1'} strokeWidth="2" fill="none"/>
              <path d="M14 2v6h6" stroke={pdfFile ? '#1B64DA' : '#8B95A1'} strokeWidth="2"/>
            </svg>
            <span style={{
              fontSize: 13, color: pdfFile ? '#1B64DA' : '#8B95A1',
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {pdfFile ? pdfFile.name : 'PDF 파일 선택'}
            </span>
            {pdfFile && !loading && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setPdfFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B95A1', fontSize: 16, padding: 0 }}
              >✕</button>
            )}
          </div>
          {step === 'analyzing' && (
            <p style={{ fontSize: 12, color: '#1B64DA', marginTop: 6, margin: '6px 0 0' }}>
              AI가 생기부를 분석하고 있습니다. 약 20~30초 소요됩니다...
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} disabled={loading} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #D1D5DB',
            fontSize: 14, fontWeight: 600, color: '#4E5968', background: '#fff',
            cursor: loading ? 'default' : 'pointer',
          }}>취소</button>
          <button onClick={submit} disabled={loading || !form.name.trim()} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            fontSize: 14, fontWeight: 700, color: '#fff',
            background: !form.name.trim() || loading ? '#B0C4E8' : '#1B64DA',
            cursor: !form.name.trim() || loading ? 'default' : 'pointer',
          }}>{btnLabel}</button>
        </div>
      </div>
    </div>
  );
}
