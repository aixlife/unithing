'use client';
import { useState } from 'react';
import { useStudent } from '@/contexts/StudentContext';

const GRADES = ['1학년', '2학년', '3학년'];

export function StudentModal({ onClose }: { onClose: () => void }) {
  const { addStudent } = useStudent();
  const [form, setForm] = useState({ name: '', grade: '1학년', school: '', target_dept: '' });
  const [loading, setLoading] = useState(false);

  const handle = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    await addStudent({ ...form, naesin_data: null, segibu_pdf_url: null });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        width: 380, boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
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
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4E5968', display: 'block', marginBottom: 6 }}>학년</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {GRADES.map(g => (
              <button key={g} onClick={() => handle('grade', g)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: form.grade === g ? '2px solid #1B64DA' : '1px solid #D1D5DB',
                background: form.grade === g ? '#EEF4FF' : '#fff',
                color: form.grade === g ? '#1B64DA' : '#4E5968',
              }}>{g}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #D1D5DB',
            fontSize: 14, fontWeight: 600, color: '#4E5968', background: '#fff', cursor: 'pointer',
          }}>취소</button>
          <button onClick={submit} disabled={loading || !form.name.trim()} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            fontSize: 14, fontWeight: 700, color: '#fff',
            background: !form.name.trim() ? '#B0C4E8' : '#1B64DA', cursor: 'pointer',
          }}>{loading ? '저장 중...' : '등록'}</button>
        </div>
      </div>
    </div>
  );
}
