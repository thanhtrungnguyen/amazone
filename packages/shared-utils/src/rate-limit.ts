import { getRedis } from "./redis";
import { createLogger } from "./logger";

const log = createLogger("rate-limit");

export interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Date when the current window resets */
  resetAt: Date;
}

interface RateLimiterHandle {
  check(identifier: string): Promise<RateLimitResult>;
  /** Stop cleanup timers (useful for tests) */
  destroy(): void;
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const MEMORY_CLEANUP_INTERVAL_MS = 60_000;

function createMemoryLimiter(
  prefix: string,
  config: RateLimitConfig,
): RateLimiterHandle {
  const store = new Map<string, MemoryEntry>();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, MEMORY_CLEANUP_INTERVAL_MS);

  // Allow the process to exit without waiting for the cleanup timer
  if (timer && typeof timer === "object" && "unref" in timer) {
    (timer as NodeJS.Timeout).unref();
  }

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const now = Date.now();
      const key = `${prefix}:${identifier}`;
      const windowMs = config.windowSec * 1000;
      const entry = store.get(key);

      // No existing entry or window expired -- start fresh
      if (!entry || now >= entry.resetAt) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return {
          success: true,
          remaining: config.limit - 1,
          resetAt: new Date(resetAt),
        };
      }

      entry.count += 1;

      if (entry.count > config.limit) {
        return {
          success: false,
          remaining: 0,
          resetAt: new Date(entry.resetAt),
        };
      }

      return {
        success: true,
        remaining: config.limit - entry.count,
        resetAt: new Date(entry.resetAt),
      };
    },

    destroy(): void {
      clearInterval(timer);
      store.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Redis-backed limiter (fixed window via INCR + EXPIRE)
// ---------------------------------------------------------------------------

function createRedisLimiter(
  prefix: string,
  config: RateLimitConfig,
): RateLimiterHandle {
  const memoryFallback = createMemoryLimiter(prefix, config);

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const redis = await getRedis();

      if (!redis) {
        return memoryFallback.check(identifier);
      }

      const key = `rl:${prefix}:${identifier}`;

      try {
        const results = await redis
          .multi()
          .incr(key)
          .ttl(key)
          .exec();

        if (!results) {
          log.warn({ key }, "Redis MULTI/EXEC returned null, falling back to memory");
          return memoryFallback.check(identifier);
        }

        const [[incrErr, count], [ttlErr, ttl]] = results as [
          [Error | null, number],
          [Error | null, number],
        ];

        if (incrErr || ttlErr) {
          log.warn(
            { incrErr, ttlErr, key },
            "Redis MULTI/EXEC returned errors, falling back to memory",
          );
          return memoryFallback.check(identifier);
        }

        // First request in this window -- set the expiry
        if (count === 1 || ttl === -1) {
          await redis.expire(key, config.windowSec);
        }

        const remainingTtl = ttl > 0 ? ttl : config.windowSec;
        const resetAt = new Date(Date.now() + remainingTtl * 1000);

        if (count > config.limit) {
          return {
            success: false,
            remaining: 0,
            resetAt,
          };
        }

        return {
          success: true,
          remaining: config.limit - count,
          resetAt,
        };
      } catch (error) {
        log.warn(
          { err: error, key },
          "Redis rate-limit check failed, falling back to memory",
        );
        return memoryFallback.check(identifier);
      }
    },

    destroy(): void {
      memoryFallback.destroy();
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a rate limiter with the given prefix and configuration.
 *
 * Uses Redis when available (production), otherwise falls back to an
 * in-memory store. The in-memory fallback does not work across multiple
 * server instances.
 */
export function createRateLimiter(
  prefix: string,
  config: RateLimitConfig,
): RateLimiterHandle {
  return createRedisLimiter(prefix, config);
}
