export type AiQuotaScope = 'segibu' | 'seteuk' | 'subjects';

type Bucket = {
  day: string;
  count: number;
};

type QuotaResult =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; status: 401 | 429; error: string; remaining: number; limit: number };

const DEFAULT_LIMITS: Record<AiQuotaScope, number> = {
  segibu: 30,
  seteuk: 120,
  subjects: 120,
};

const GLOBAL_KEY = '__unithing_ai_usage__';

function usageStore() {
  const globalStore = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Map<string, Bucket> };
  globalStore[GLOBAL_KEY] ??= new Map<string, Bucket>();
  return globalStore[GLOBAL_KEY];
}

function todayKst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getLimit(scope: AiQuotaScope) {
  const envKey = `AI_DAILY_LIMIT_${scope.toUpperCase()}`;
  const parsed = Number(process.env[envKey]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LIMITS[scope];
}

export function checkAiQuota(scope: AiQuotaScope, teacherId?: string): QuotaResult {
  const limit = getLimit(scope);
  if (!teacherId) {
    return { ok: false, status: 401, error: 'Unauthorized', remaining: 0, limit };
  }

  const day = todayKst();
  const key = `${day}:${teacherId}:${scope}`;
  const store = usageStore();
  const current = store.get(key);
  const bucket = current?.day === day ? current : { day, count: 0 };

  if (bucket.count >= limit) {
    return {
      ok: false,
      status: 429,
      error: `AI 일일 사용량을 초과했습니다. 내일 다시 시도하거나 관리자에게 문의해 주세요. (${scope}: ${limit}/day)`,
      remaining: 0,
      limit,
    };
  }

  bucket.count += 1;
  store.set(key, bucket);
  return { ok: true, remaining: Math.max(0, limit - bucket.count), limit };
}
