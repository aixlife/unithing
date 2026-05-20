import { unzipSync } from 'fflate';

export type StudentImportRow = {
  name: string;
  school: string;
  grade: string;
  target_dept: string;
};

const SUPPORTED_IMPORT_EXTENSIONS = /\.(csv|tsv|txt|xlsx)$/i;

export function isSupportedStudentImportFile(fileName: string) {
  return SUPPORTED_IMPORT_EXTENSIONS.test(fileName);
}

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

function rowsToStudents(rows: string[][]): StudentImportRow[] {
  if (rows.length === 0) return [];
  const dataRows = hasHeader(rows[0]) ? rows.slice(1) : rows;
  return dataRows.map(cells => ({
    name: cells[0] ?? '',
    school: cells[1] ?? '',
    grade: normalizeGrade(cells[2] ?? ''),
    target_dept: cells[3] ?? '',
  })).filter(row => row.name.trim());
}

export async function readDelimitedText(file: File) {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('\uFFFD')) return utf8;
  try {
    return new TextDecoder('euc-kr').decode(buffer);
  } catch {
    return utf8;
  }
}

export function parseDelimitedStudents(text: string): StudentImportRow[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const delimiter = lines.some(line => line.includes('\t')) ? '\t' : ',';
  return rowsToStudents(lines.map(line => splitDelimitedLine(line, delimiter)));
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function getAttr(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match?.[1] ?? '';
}

function stripTags(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, ''));
}

function parseSharedStrings(xml: string) {
  const strings: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;
  while ((match = siRegex.exec(xml))) {
    const itemXml = match[1];
    const parts = Array.from(itemXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map(part => decodeXml(part[1]));
    strings.push(parts.length > 0 ? parts.join('') : stripTags(itemXml));
  }
  return strings;
}

function columnIndex(ref: string, fallback: number) {
  const letters = ref.match(/[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) return fallback;
  return letters.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function resolveFirstWorksheetPath(files: Record<string, Uint8Array>) {
  const decoder = new TextDecoder('utf-8');
  const workbookBytes = files['xl/workbook.xml'];
  const relBytes = files['xl/_rels/workbook.xml.rels'];
  if (workbookBytes && relBytes) {
    const workbook = decoder.decode(workbookBytes);
    const rels = decoder.decode(relBytes);
    const sheetRelId = workbook.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
    if (sheetRelId) {
      const relMatch = new RegExp(`<Relationship\\b[^>]*\\bId="${sheetRelId}"[^>]*\\bTarget="([^"]+)"`, 'i').exec(rels);
      const target = relMatch?.[1];
      if (target) {
        const normalized = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
        if (files[normalized]) return normalized;
      }
    }
  }
  return files['xl/worksheets/sheet1.xml'] ? 'xl/worksheets/sheet1.xml' : '';
}

function parseWorksheetRows(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(xml))) {
    const cells: string[] = [];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch: RegExpExecArray | null;
    let fallbackIndex = 0;
    while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const index = columnIndex(getAttr(attrs, 'r'), fallbackIndex);
      const type = getAttr(attrs, 't');
      const inlineText = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1];
      const rawValue = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? '';
      const value = type === 's'
        ? sharedStrings[Number(rawValue)] ?? ''
        : type === 'inlineStr'
          ? decodeXml(inlineText ?? '')
          : decodeXml(rawValue);
      cells[index] = value.trim();
      fallbackIndex = index + 1;
    }
    if (cells.some(Boolean)) rows.push(cells);
  }
  return rows;
}

export function parseXlsxStudents(buffer: ArrayBuffer): StudentImportRow[] {
  const files = unzipSync(new Uint8Array(buffer));
  const decoder = new TextDecoder('utf-8');
  const worksheetPath = resolveFirstWorksheetPath(files);
  if (!worksheetPath) return [];
  const sharedStrings = files['xl/sharedStrings.xml'] ? parseSharedStrings(decoder.decode(files['xl/sharedStrings.xml'])) : [];
  return rowsToStudents(parseWorksheetRows(decoder.decode(files[worksheetPath]), sharedStrings));
}

export async function readStudentImportRows(file: File): Promise<StudentImportRow[]> {
  if (file.name.toLowerCase().endsWith('.xlsx')) {
    return parseXlsxStudents(await file.arrayBuffer());
  }
  return parseDelimitedStudents(await readDelimitedText(file));
}
