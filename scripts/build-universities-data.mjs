#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSource = path.resolve(repoRoot, '../service_source/9등급 변환기_2025 어디가 입결.csv');
const defaultOut = path.resolve(repoRoot, 'src/data/universitiesRaw.json');

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  })
);

const sourcePath = path.resolve(args.get('source') ?? defaultSource);
const outPath = path.resolve(args.get('out') ?? defaultOut);
const includeTypes = new Set((args.get('include') ?? '교과,종합').split(',').map((v) => v.trim()).filter(Boolean));
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

function parseGrade(value) {
  const normalized = value.trim().match(/[0-9]+(?:\.[0-9]+)?/)?.[0];
  if (!normalized) return null;
  const grade = Number(normalized);
  if (!Number.isFinite(grade) || grade < 1 || grade > 9) return null;
  return Number(grade.toFixed(2));
}

function formatGrade(value) {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

function formatEntry(entry) {
  return `{"n": ${JSON.stringify(entry.n)}, "t": ${JSON.stringify(entry.t)}, "p": ${JSON.stringify(entry.p)}, "d": ${JSON.stringify(entry.d)}, "g": ${formatGrade(entry.g)}}`;
}

function buildEntries(rows) {
  const stats = {
    sourceRows: Math.max(0, rows.length - 1),
    included: 0,
    excludedByType: {},
    invalidGrade: 0,
  };

  const entries = rows.slice(1).flatMap((row) => {
    const [nameRaw = '', typeRaw = '', processRaw = '', deptRaw = '', gradeRaw = ''] = row;
    const name = nameRaw.trim().replace(/^\uFEFF/, '');
    const type = typeRaw.trim();
    const process = processRaw.trim();
    const dept = deptRaw.trim();
    const grade = parseGrade(gradeRaw);

    if (!name || !type || !process || !dept) return [];
    if (grade === null) {
      stats.invalidGrade += 1;
      return [];
    }
    if (!includeTypes.has(type)) {
      stats.excludedByType[type] = (stats.excludedByType[type] ?? 0) + 1;
      return [];
    }

    stats.included += 1;
    return [{ n: name, t: type, p: process, d: dept, g: grade }];
  });

  return { entries, stats };
}

const raw = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '');
const { entries, stats } = buildEntries(parseCsv(raw));
const output = `[${entries.map(formatEntry).join(', ')}]\n`;

if (checkOnly) {
  const current = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const same = JSON.stringify(current) === JSON.stringify(entries);
  console.log(JSON.stringify({ same, outPath, ...stats }, null, 2));
  process.exit(same ? 0 : 1);
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(JSON.stringify({ outPath, ...stats }, null, 2));
