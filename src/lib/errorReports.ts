import { createHmac } from 'crypto';

export type ErrorReportPayload = {
  pagePath?: string;
  serviceLabel?: string;
  visibleError?: string;
  userNote?: string;
  clientContext?: unknown;
  appContext?: unknown;
};

export type ErrorReportRow = {
  id: string;
  created_at: string;
  status: string;
  reporter_email: string | null;
  page_path: string | null;
  service_label: string | null;
  visible_error: string | null;
  user_note: string | null;
  user_agent: string | null;
  app_context: unknown;
  client_context: unknown;
  server_context: unknown;
  mail_status: string | null;
  mail_error: string | null;
};

const MAX_TEXT = 4000;
const MAX_JSON_TEXT = 8000;
const MAIL_WEBHOOK_TIMEOUT_MS = 2500;

function truncate(value: string, max = MAX_TEXT) {
  return value.length > max ? `${value.slice(0, max)}... [truncated]` : value;
}

export function redactText(value: unknown, max = MAX_TEXT) {
  if (value == null) return '';
  return truncate(String(value), max)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, '[phone]')
    .replace(/\b\d{6}-\d{7}\b/g, '[id-number]')
    .replace(/\b(AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,})\b/g, '[api-key]')
    .replace(/\b(Bearer\s+)[0-9A-Za-z._-]{20,}\b/gi, '$1[token]')
    .replace(/\b(password|secret|token|api[_-]?key|authorization)\s*[:=]\s*[^,\s}]+/gi, '$1=[redacted]')
    .replace(/[A-Za-z0-9+/=_-]{120,}/g, '[long-token]');
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numberOrNull(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sanitizeClientContext(value: unknown) {
  const record = asRecord(value);
  return {
    viewport: redactText(record.viewport, 80),
    devicePixelRatio: numberOrNull(record.devicePixelRatio),
    timezone: redactText(record.timezone, 80),
    language: redactText(record.language, 30),
    reportedAt: redactText(record.reportedAt, 80),
  };
}

export function sanitizeErrorReportPayload(input: ErrorReportPayload) {
  return {
    page_path: redactText(input.pagePath, 500),
    service_label: redactText(input.serviceLabel, 200),
    visible_error: redactText(input.visibleError, 2000),
    user_note: redactText(input.userNote, 3000),
    client_context: sanitizeClientContext(input.clientContext),
    app_context: null,
  };
}

function stringifyJson(value: unknown) {
  const text = JSON.stringify(value ?? {}, null, 2);
  return redactText(text, MAX_JSON_TEXT);
}

export function formatErrorReportForDeveloper(report: ErrorReportRow) {
  return [
    '[UNITHING 오류 보고]',
    `ID: ${report.id}`,
    `접수시각: ${report.created_at}`,
    `상태: ${report.status}`,
    `페이지: ${report.page_path || '-'}`,
    `서비스: ${report.service_label || '-'}`,
    '보고자: 관리자 화면에서만 확인',
    '',
    '[화면에 보인 오류]',
    report.visible_error || '-',
    '',
    '[사용자 메모]',
    report.user_note || '-',
    '',
    '[브라우저]',
    report.user_agent || '-',
    '',
    '[클라이언트 맥락]',
    stringifyJson(report.client_context),
    '',
    '[서버 맥락]',
    stringifyJson(report.server_context),
    '',
    '주의: 학생 원문, PDF 원본, API 키, 토큰, 비밀번호는 포함하지 않는 범위로 전달하세요.',
  ].join('\n');
}

export async function notifyErrorReportByMail(report: ErrorReportRow) {
  const webhookUrl = process.env.UNITHING_MAIL_WEBHOOK_URL;
  const to = process.env.UNITHING_MAIL_TO;
  const resendApiKey = process.env.UNITHING_RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!to) return { status: 'skipped', error: null };

  const subject = `[UNITHING 오류 보고] ${report.service_label || report.page_path || report.id}`;
  const text = formatErrorReportForDeveloper(report);

  if (webhookUrl) {
    const secret = process.env.UNITHING_MAIL_WEBHOOK_SECRET;
    if (!secret) return { status: 'failed', error: 'UNITHING_MAIL_WEBHOOK_SECRET is missing' };
    const body = JSON.stringify({ to, subject, text });
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    try {
      const url = new URL(webhookUrl);
      if (url.protocol !== 'https:') {
        return { status: 'failed', error: 'mail webhook must use https' };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Unithing-Signature': signature,
        },
        signal: AbortSignal.timeout(MAIL_WEBHOOK_TIMEOUT_MS),
        body,
      });
      if (!res.ok) {
        return { status: 'failed', error: `mail webhook ${res.status}` };
      }
      return { status: 'sent', error: null };
    } catch (error) {
      return { status: 'failed', error: redactText(error, 1000) };
    }
  }

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(MAIL_WEBHOOK_TIMEOUT_MS),
        body: JSON.stringify({
          from: process.env.UNITHING_MAIL_FROM || 'UNITHING <naminsoo@aixlife.co.kr>',
          to,
          reply_to: process.env.UNITHING_MAIL_REPLY_TO || 'naminsoo@aixlife.co.kr',
          subject,
          text,
        }),
      });
      if (!res.ok) return { status: 'failed', error: `resend ${res.status}` };
      return { status: 'sent', error: null };
    } catch (error) {
      return { status: 'failed', error: redactText(error, 1000) };
    }
  }

  return { status: 'skipped', error: null };
}
