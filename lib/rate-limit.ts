/**
 * Rate limiter en memoria — válido para una sola instancia (MVP).
 * Para producción multi-instancia, sustituir la implementación por
 * Upstash Redis (@upstash/ratelimit) manteniendo esta misma firma.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export interface RateLimitOptions {
  limit: number;
  windowSec: number;
}

export function rateLimit(
  key: string,
  { limit, windowSec }: RateLimitOptions,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowSec * 1000 });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count++;
  return true;
}
