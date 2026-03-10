import type Redis from "ioredis";

let redis: Redis | null = null;

/**
 * Lazy singleton Redis client. Returns null if REDIS_URL is not set
 * (graceful degradation — cache functions become no-ops).
 *
 * Uses dynamic import to avoid pulling ioredis into client/edge bundles.
 */
export async function getRedis(): Promise<Redis | null> {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  const { default: IoRedis } = await import("ioredis");

  redis = new IoRedis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
  });

  redis.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });

  return redis;
}
