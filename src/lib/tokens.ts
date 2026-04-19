export const colors = {
  primary: '#1B64DA',
  primaryHover: '#1756BC',
  primarySoft: '#EBF2FF',
  primaryBorder: '#CFDFFB',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  bg: '#F4F6F8',
  bgAlt: '#EFF1F4',
  surface: '#FFFFFF',
  border: '#E5E8EB',
  borderStrong: '#D1D6DB',
  text: '#191F28',
  textMuted: '#4E5968',
  textSubtle: '#8B95A1',
} as const;

export const comp = {
  academic: { color: '#1B64DA', soft: '#EBF2FF', border: '#CFDFFB', label: '학업역량' },
  career:   { color: '#D97706', soft: '#FEF3C7', border: '#FCD89A', label: '진로역량' },
  community:{ color: '#059669', soft: '#D1FAE5', border: '#A7F3D0', label: '공동체역량' },
} as const;

export type CompKey = keyof typeof comp;
