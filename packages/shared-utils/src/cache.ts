import { getRedis } from "./redis";

interface CacheOptions {
  /** Time-to-live in seconds (default 60) */
  ttl?: number;
}

/**
 * Read-through cache: returns cached value if available, otherwise calls `fn`,
 * caches the result, and returns it. Gracefully degrades to direct calls when
 * Redis is unavailable.
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 60 } = options;
  const redis = getRedis();

  if (!redis) return fn();

  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // Redis down — fall through to fn()
  }

  const result = await fn();

  try {
    await redis.set(key, JSON.stringify(result), "EX", ttl);
  } catch {
    // Best-effort cache write
  }

  return result;
}

/**
 * Invalidate one or more cache keys. Supports glob patterns via Redis KEYS
 * (use sparingly — for targeted invalidation only).
 */
export async function invalidateCache(...patterns: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
      } else {
        await redis.del(pattern);
      }
    }
  } catch {
    // Best-effort invalidation
  }
}
