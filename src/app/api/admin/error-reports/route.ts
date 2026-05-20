import { getAdminSession } from '@/lib/adminAuth';
import { formatErrorReportForDeveloper, type ErrorReportRow } from '@/lib/errorReports';
import { isUsingSupabaseServiceRole, supabaseServer } from '@/lib/supabaseServer';

const REPORT_STATUSES = new Set(['new', 'in_progress', 'done', 'deferred']);

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getAdminNote(report: ErrorReportRow) {
  const serverContext = asRecord(report.server_context);
  return typeof serverContext.admin_note === 'string' ? serverContext.admin_note : '';
}

function toAdminReport(report: ErrorReportRow) {
  const developerCopy = formatErrorReportForDeveloper(report);
  return {
    id: report.id,
    created_at: report.created_at,
    status: report.status,
    reporter_email: report.reporter_email,
    page_path: report.page_path,
    service_label: report.service_label,
    visible_error: report.visible_error,
    user_note: report.user_note,
    user_agent: report.user_agent,
    mail_status: report.mail_status,
    mail_error: report.mail_error,
    admin_note: getAdminNote(report),
    developer_copy: developerCopy,
  };
}

export async function GET(req: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isUsingSupabaseServiceRole) {
    return Response.json({
      error: '관리자 오류 보고함을 사용하려면 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.',
    }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 100) || 100));
  const { data, error } = await supabaseServer
    .from('error_reports')
    .select('id, created_at, status, reporter_email, page_path, service_label, visible_error, user_note, user_agent, client_context, server_context, mail_status, mail_error')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return Response.json({ error: '오류 리포트를 불러오지 못했습니다.', detail: error.message }, { status: 500 });
  }

  const reports = ((data ?? []) as ErrorReportRow[]).map(toAdminReport);

  return Response.json({ reports });
}

export async function PATCH(req: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isUsingSupabaseServiceRole) {
    return Response.json({
      error: '관리자 오류 보고함을 사용하려면 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.',
    }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const payload = asRecord(body);
  const id = typeof payload.id === 'string' ? payload.id : '';
  const status = typeof payload.status === 'string' ? payload.status : '';
  const adminNote = typeof payload.adminNote === 'string' ? payload.adminNote.slice(0, 3000) : null;

  if (!id) return Response.json({ error: '오류 보고 ID가 필요합니다.' }, { status: 400 });
  if (status && !REPORT_STATUSES.has(status)) {
    return Response.json({ error: '지원하지 않는 처리 상태입니다.' }, { status: 400 });
  }

  const { data: current, error: lookupError } = await supabaseServer
    .from('error_reports')
    .select('server_context, status')
    .eq('id', id)
    .single();

  if (lookupError) {
    return Response.json({ error: '오류 보고를 찾지 못했습니다.', detail: lookupError.message }, { status: 404 });
  }

  const nextServerContext = {
    ...asRecord(current?.server_context),
    ...(adminNote !== null ? { admin_note: adminNote } : {}),
    admin_updated_at: new Date().toISOString(),
  };

  const updatePayload: Record<string, unknown> = {
    server_context: nextServerContext,
  };
  if (status) updatePayload.status = status;

  const { data, error } = await supabaseServer
    .from('error_reports')
    .update(updatePayload)
    .eq('id', id)
    .select('id, created_at, status, reporter_email, page_path, service_label, visible_error, user_note, user_agent, client_context, server_context, mail_status, mail_error')
    .single();

  if (error) {
    return Response.json({ error: '오류 보고 상태를 저장하지 못했습니다.', detail: error.message }, { status: 500 });
  }

  return Response.json({ report: toAdminReport(data as ErrorReportRow) });
}
