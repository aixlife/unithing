export type TargetPickSlot = 'challenge' | 'fit' | 'safe';
export type TargetPickLabel = '도전' | '적정' | '안정';

export type UniversityTargetPick = {
  slot: TargetPickSlot;
  slotLabel: TargetPickLabel;
  name: string;
  dept: string;
  process: string;
  type: string;
  category: string;
  grade: number;
  badge: TargetPickLabel;
  currentGrade9: number;
  gradeGap: number;
  source: 'service1-2025-admissions';
  savedAt: string;
};

export type UniversityPicks = Partial<Record<TargetPickSlot, UniversityTargetPick>>;

export type Service1Snapshot = {
  grade5: number;
  grade9: number;
  conversionVersion: 'gyeonggi' | 'busan' | 'gwangju' | 'mixed';
  conversionReason: string;
  searchRange: number;
  showAmbitious: boolean;
  updatedAt: string;
};

export type NaesinData = Record<string, unknown> & {
  service1?: Service1Snapshot;
  university_picks?: UniversityPicks;
};

export const TARGET_PICK_SLOTS: { slot: TargetPickSlot; label: TargetPickLabel }[] = [
  { slot: 'challenge', label: '도전' },
  { slot: 'fit', label: '적정' },
  { slot: 'safe', label: '안정' },
];

export const TARGET_PICK_LABELS: Record<TargetPickSlot, TargetPickLabel> = {
  challenge: '도전',
  fit: '적정',
  safe: '안정',
};

const SLOT_BY_LABEL: Record<TargetPickLabel, TargetPickSlot> = {
  도전: 'challenge',
  적정: 'fit',
  안정: 'safe',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isTargetSlot(value: unknown): value is TargetPickSlot {
  return value === 'challenge' || value === 'fit' || value === 'safe';
}

function isTargetLabel(value: unknown): value is TargetPickLabel {
  return value === '도전' || value === '적정' || value === '안정';
}

function isUniversityTargetPick(value: unknown): value is UniversityTargetPick {
  if (!isRecord(value)) return false;
  return (
    isTargetSlot(value.slot) &&
    isTargetLabel(value.slotLabel) &&
    typeof value.name === 'string' &&
    typeof value.dept === 'string' &&
    typeof value.process === 'string' &&
    typeof value.type === 'string' &&
    typeof value.category === 'string' &&
    typeof value.grade === 'number' &&
    isTargetLabel(value.badge) &&
    typeof value.currentGrade9 === 'number' &&
    typeof value.gradeGap === 'number' &&
    value.source === 'service1-2025-admissions' &&
    typeof value.savedAt === 'string'
  );
}

export function getNaesinData(raw: unknown): NaesinData {
  return isRecord(raw) ? { ...raw } : {};
}

export function getUniversityPicks(raw: unknown): UniversityPicks {
  const rawPicks = getNaesinData(raw).university_picks;
  if (!isRecord(rawPicks)) return {};

  return TARGET_PICK_SLOTS.reduce<UniversityPicks>((acc, { slot }) => {
    const pick = rawPicks[slot];
    if (isUniversityTargetPick(pick)) acc[slot] = pick;
    return acc;
  }, {});
}

export function toTargetPickSlot(label: TargetPickLabel): TargetPickSlot {
  return SLOT_BY_LABEL[label];
}

export function getPrimaryTargetPick(picks: UniversityPicks): UniversityTargetPick | null {
  return picks.fit ?? picks.challenge ?? picks.safe ?? null;
}
