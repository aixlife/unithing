#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSource = path.resolve(repoRoot, '../service_source/고교학점제_2028학년도 권역별 대학별 권장과목.csv');
const defaultOut = path.resolve(repoRoot, 'src/data/recommendedSubjectsRaw.json');

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  })
);

const sourcePath = path.resolve(args.get('source') ?? defaultSource);
const outPath = path.resolve(args.get('out') ?? defaultOut);
const checkOnly = args.get('check') === 'true';

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += ch;
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }

  return rows;
}

function clean(value) {
  return String(value ?? '').replace(/\r/g, '').trim();
}

function cleanText(value) {
  const text = clean(value);
  return text === '-' ? '' : text;
}

function splitSubjects(value) {
  const text = cleanText(value);
  if (!text) return [];
  if (/(진로|적성|계열|교과목|과목 선택|이수)/.test(text) && !text.includes(',')) return [];
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeRecord(row, index) {
  const region = clean(row[0]);
  const location = clean(row[1]);
  const university = clean(row[2]);
  const unitA = clean(row[3]);
  const unitB = clean(row[4]);
  const core = cleanText(row[5]);
  const recommended = cleanText(row[6]);
  const note = cleanText(row[7]);

  const college = unitB ? unitA : '';
  const major = unitB || unitA;

  if (!region || !location || !university || !major) return null;

  return {
    id: `${university}-${major}-${index}`,
    region,
    location,
    university,
    college,
    major,
    unit: [college, major].filter(Boolean).join(' '),
    core,
    recommended,
    coreSubjects: splitSubjects(core),
    recommendedSubjects: splitSubjects(recommended),
    note,
  };
}

const decoded = new TextDecoder('euc-kr').decode(fs.readFileSync(sourcePath));
const rows = parseCsv(decoded);
const entries = rows.slice(4).map(makeRecord).filter(Boolean);
const output = `${JSON.stringify(entries, null, 2)}\n`;

const stats = {
  sourceRows: rows.length,
  dataRows: entries.length,
  universities: new Set(entries.map((entry) => entry.university)).size,
  withCoreSubjects: entries.filter((entry) => entry.coreSubjects.length > 0).length,
  withRecommendedSubjects: entries.filter((entry) => entry.recommendedSubjects.length > 0).length,
};

if (checkOnly) {
  const same = fs.existsSync(outPath) && fs.readFileSync(outPath, 'utf8') === output;
  console.log(JSON.stringify({ same, outPath, ...stats }, null, 2));
  process.exit(same ? 0 : 1);
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(JSON.stringify({ outPath, ...stats }, null, 2));
