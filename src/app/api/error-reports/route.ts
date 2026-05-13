import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import {
  notifyErrorReportByMail,
  sanitizeErrorReportPayload,
  type ErrorReportPayload,
  type ErrorReportRow,
} from '@/lib/errorReports';
import { isUsingSupabaseServiceRole, supabaseServer } from '@/lib/supabaseServer';

const REPORT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 10;
const reportAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request, teacherId: string) {
  return [
    teacherId,
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown',
  ].join(':');
}

function checkReportLimit(key: string) {
  const now = Date.now();
  const bucket = reportAttempts.get(key);
  if (!bucket || bucket.resetAt < now) {
    reportAttempts.set(key, { count: 1, resetAt: now + REPORT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_REPORTS_PER_WINDOW) return false;
  bucket.count += 1;
  reportAttempts.set(key, bucket);
  return true;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const teacherId = (session?.user as { teacherId?: string } | undefined)?.teacherId;
  if (!session?.user || !teacherId) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!isUsingSupabaseServiceRole) {
    return Response.json({
      error: '오류 보고 저장을 사용하려면 서버 환경변수 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.',
    }, { status: 503 });
  }
  if (!checkReportLimit(getClientKey(req, teacherId))) {
    return Response.json({ error: '오류 보고가 짧은 시간에 너무 많이 접수되었습니다. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as ErrorReportPayload;
  if (!String(body.visibleError ?? '').trim() && !String(body.userNote ?? '').trim()) {
    return Response.json({ error: '오류 내용이나 추가 메모를 입력해 주세요.' }, { status: 400 });
  }

  const sanitized = sanitizeErrorReportPayload(body);
  const insertPayload = {
    ...sanitized,
    status: 'new',
    reporter_teacher_id: teacherId,
    reporter_email: session.user.email ?? null,
    user_agent: req.headers.get('user-agent'),
    server_context: {
      receivedAt: new Date().toISOString(),
      nextRuntime: 'node',
    },
    mail_status: 'pending',
  };

  const { data, error } = await supabaseServer
    .from('error_reports')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    return Response.json({
      error: '오류 리포트를 저장하지 못했습니다.',
      detail: error.message,
    }, { status: 500 });
  }

  const report = data as ErrorReportRow;
  const mail = await notifyErrorReportByMail(report);
  await supabaseServer
    .from('error_reports')
    .update({ mail_status: mail.status, mail_error: mail.error })
    .eq('id', report.id);

  return Response.json({ ok: true, reportId: report.id, mailStatus: mail.status });
}
