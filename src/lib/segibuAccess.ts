export const SEGIBU_ANALYSIS_ALLOWED_EMAILS = ['sophia15@ssgh.hs.kr'] as const;

export function isSegibuAnalysisAllowedEmail(email?: string | null) {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  return SEGIBU_ANALYSIS_ALLOWED_EMAILS.includes(
    normalizedEmail as (typeof SEGIBU_ANALYSIS_ALLOWED_EMAILS)[number],
  );
}
