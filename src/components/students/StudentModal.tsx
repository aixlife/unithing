'use client';
import { useState } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import type { Student } from '@/lib/supabase';

const GRADES = ['1학년', '2학년', '3학년'];
const EMPTY_FORM = { name: '', grade: '1학년', school: '', target_dept: '' };

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map(cell => cell.replace(/^"|"$/g, '').trim());
}

function normalizeGrade(raw: string) {
  if (raw.includes('3')) return '3학년';
  if (raw.includes('2')) return '2학년';
  return '1학년';
}

function hasHeader(cells: string[]) {
  const first = cells.join(' ').toLowerCase();
  return first.includes('학생') || first.includes('name') || first.includes('학교') || first.includes('학년');
}

async function readDelimitedText(file: File) {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('\uFFFD')) return utf8;
  try {
    return new TextDecoder('euc-kr').decode(buffer);
  } catch {
    return utf8;
  }
}

function parseBulkStudents(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const delimiter = lines.some(line => line.includes('\t')) ? '\t' : ',';
  const rows = lines.map(line => splitDelimitedLine(line, delimiter));
  const dataRows = hasHeader(rows[0]) ? rows.slice(1) : rows;
  return dataRows.map(cells => ({
    name: cells[0] ?? '',
    school: cells[1] ?? '',
    grade: normalizeGrade(cells[2] ?? ''),
    target_dept: cells[3] ?? '',
  })).filter(row => row.name.trim());
}

export function StudentModal({ onClose, student }: { onClose: () => void; student?: Student | null }) {
  const { addStudent, updateStudent } = useStudent();
  const isEdit = Boolean(student);
  const [form, setForm] = useState(() => student ? {
    name: student.name,
    grade: student.grade || '1학년',
    school: student.school || '',
    target_dept: student.target_dept || '',
  } : EMPTY_FORM);
  const [step, setStep] = useState<'idle' | 'saving'>('idle');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const handle = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const loading = step !== 'idle';

  const submit = async () => {
    if (!form.name.trim() || loading) return;
    setStep('saving');
    const saved = student
      ? await updateStudent(student.id, form)
      : await addStudent({ ...form, naesin_data: null, segibu_pdf_url: null });
    if (saved) onClose();
    else setStep('idle');
  };

  const importStudents = async (file: File | null) => {
    if (!file || loading || isEdit) return;
    setBulkMessage(null);
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setBulkMessage('CSV 또는 TSV 파일로 저장한 명단만 가져올 수 있습니다.');
      return;
    }
    const rows = parseBulkStudents(await readDelimitedText(file));
    if (rows.length === 0) {
      setBulkMessage('가져올 학생을 찾지 못했습니다.');
      return;
    }
    setStep('saving');
    let savedCount = 0;
    for (const row of rows) {
      const saved = await addStudent({ ...row, naesin_data: null, segibu_pdf_url: null });
      if (saved) savedCount += 1;
    }
    setStep('idle');
    setBulkMessage(`${savedCount}명 등록 완료`);
    if (savedCount > 0) onClose();
  };

  const btnLabel = step === 'saving' ? '저장 중...' : isEdit ? '수정' : '등록';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={loading ? undefined : onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        width: 400, boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191F28', margin: '0 0 20px' }}>{isEdit ? '학생 정보 수정' : '학생 등록'}</h2>

        {[
          { label: '학생 구분명', key: 'name', placeholder: '1번 / A학생 / 별칭' },
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

        <div style={{ marginBottom: 22, padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E5E8EB', color: '#4E5968', fontSize: 12.5, lineHeight: 1.55 }}>
          실명 대신 번호나 별칭을 권장합니다. 생기부 PDF는 기능 이용 시 비식별화 확인을 거쳐 업로드합니다.
        </div>

        {!isEdit && (
          <div style={{ marginBottom: 18, padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px dashed #D1D5DB' }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4E5968', marginBottom: 7 }}>CSV 일괄 등록</label>
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
              disabled={loading}
              onChange={e => void importStudents(e.target.files?.[0] ?? null)}
              style={{ width: '100%', fontSize: 12, color: '#4E5968' }}
            />
            {bulkMessage && (
              <div style={{ marginTop: 7, fontSize: 12, fontWeight: 700, color: bulkMessage.includes('완료') ? '#059669' : '#DC2626' }}>{bulkMessage}</div>
            )}
          </div>
        )}

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
