import { getAdminSession } from '@/lib/adminAuth';
import { formatErrorReportForDeveloper, type ErrorReportRow } from '@/lib/errorReports';
import { isUsingSupabaseServiceRole, supabaseServer } from '@/lib/supabaseServer';

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

  const reports = ((data ?? []) as ErrorReportRow[]).map((report) => {
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
      developer_copy: developerCopy,
    };
  });

  return Response.json({ reports });
}
