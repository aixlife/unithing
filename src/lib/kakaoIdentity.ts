export const KAKAO_IDENTITY_DOMAIN = 'kakao.unithing.local';

export function buildKakaoTeacherIdentity(kakaoUserId: string | number | null | undefined) {
  const normalized = String(kakaoUserId ?? '').trim();
  if (!normalized) return null;
  return `kakao-${normalized}@${KAKAO_IDENTITY_DOMAIN}`;
}
