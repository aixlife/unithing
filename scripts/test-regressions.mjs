#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { zipSync, strToU8 } from 'fflate';

const bulkImport = await import('../src/lib/studentBulkImport.ts');

function makeXlsx(rows) {
  const strings = [];
  const stringIndex = new Map();
  const getStringIndex = (value) => {
    const text = String(value ?? '');
    if (!stringIndex.has(text)) {
      stringIndex.set(text, strings.length);
      strings.push(text);
    }
    return stringIndex.get(text);
  };
  const cellRef = (rowIndex, columnIndex) => {
    let n = columnIndex + 1;
    let letters = '';
    while (n > 0) {
      const remainder = (n - 1) % 26;
      letters = String.fromCharCode(65 + remainder) + letters;
      n = Math.floor((n - 1) / 26);
    }
    return `${letters}${rowIndex + 1}`;
  };
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const ref = cellRef(rowIndex, columnIndex);
      return `<c r="${ref}" t="s"><v>${getStringIndex(value)}</v></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  const files = {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>'),
    'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet><sheetData>${rowXml}</sheetData></worksheet>`),
    'xl/sharedStrings.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><sst>${strings.map((value) => `<si><t>${value}</t></si>`).join('')}</sst>`),
  };
  const zipped = zipSync(files);
  return zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength);
}

const csvRows = bulkImport.parseDelimitedStudents('학생,학교,학년,희망학과\nA학생,한국고등학교,2,컴퓨터공학과');
assert.equal(csvRows.length, 1);
assert.deepEqual(csvRows[0], {
  name: 'A학생',
  school: '한국고등학교',
  grade: '2학년',
  target_dept: '컴퓨터공학과',
});

const xlsxRows = bulkImport.parseXlsxStudents(makeXlsx([
  ['학생', '학교', '학년', '희망학과'],
  ['B학생', '돌마고등학교', '3', '전자공학과'],
]));
assert.equal(xlsxRows.length, 1);
assert.deepEqual(xlsxRows[0], {
  name: 'B학생',
  school: '돌마고등학교',
  grade: '3학년',
  target_dept: '전자공학과',
});
assert.equal(bulkImport.isSupportedStudentImportFile('students.xlsx'), true);

const service2 = await readFile('src/components/services/Service2Subject.tsx', 'utf8');
assert.equal(service2.includes('숭신고등학교'), false, 'Service2 must not hard-code 숭신고등학교');
assert.match(service2, /subject_curriculum/, 'custom curriculum must be saved/restored');
assert.match(service2, /isCsat2028Subject/, 'CSAT labels must use the 2028 subject helper');
assert.match(service2, /activeGroups\.filter/, 'plan data must use active custom groups');

const adminRoute = await readFile('src/app/api/admin/error-reports/route.ts', 'utf8');
assert.match(adminRoute, /export async function PATCH/, 'admin reports must support updates');
assert.match(adminRoute, /admin_note/, 'admin reports must preserve admin notes');

console.log('regression checks passed');
