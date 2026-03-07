import Redis from "ioredis";

let redis: Redis | null = null;

/**
 * Lazy singleton Redis client. Returns null if REDIS_URL is not set
 * (graceful degradation — cache functions become no-ops).
 */
export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
  });

  redis.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });

  return redis;
}
