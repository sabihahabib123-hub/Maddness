import "server-only";

/**
 * Fixed-window, in-memory rate limiter keyed by IP. Good enough for a single
 * server or for local development; on serverless hosts each instance has its
 * own memory, so pair it with the database duplicate check (already in place)
 * and swap in a shared store (e.g. Upstash Redis) for stricter limits.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterS: number } {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterS: 0 };
  }
  if (b.count >= limit) return { ok: false, retryAfterS: Math.ceil((b.resetAt - now) / 1000) };
  b.count += 1;
  return { ok: true, retryAfterS: 0 };
}
