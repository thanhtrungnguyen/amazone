/**
 * Simple in-memory rate limiter for API routes.
 *
 * NOTE: This is per-process only. In a multi-instance deployment, use
 * Redis-backed rate limiting instead. Suitable for single-server setups
 * and development.
 */

interface RateLimitEntry {
  /** Number of requests in the current window */
  count: number;
  /** Timestamp (ms) when the window resets */
  resetAt: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  reset: number;
}

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
  /** Maximum requests allowed per window (default: 10) */
  maxRequests?: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 10;

/** Interval between stale entry cleanups (5 minutes) */
const CLEANUP_INTERVAL_MS = 5 * 60_000;

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;

    // Schedule periodic cleanup to prevent memory leaks
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_MS);

    // Allow the process to exit without waiting for the timer
    if (this.cleanupTimer && typeof this.cleanupTimer === "object" && "unref" in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Check whether a request identified by `key` should be allowed.
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // No existing entry or window has expired — start a fresh window
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        success: true,
        remaining: this.maxRequests - 1,
        reset: resetAt,
      };
    }

    // Window is still active
    entry.count += 1;

    if (entry.count > this.maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    return {
      success: true,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetAt,
    };
  }

  /**
   * Remove entries whose window has expired.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup timer (useful for tests).
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }
}

/**
 * Pre-configured rate limiter for auth endpoints.
 * 10 requests per minute per key (typically IP address).
 */
export const authRateLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

/**
 * Factory for creating custom rate limiters.
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

/**
 * Extract client IP from request headers.
 * Falls back to "unknown" when IP cannot be determined.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; the first is the client
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

export type { RateLimitResult, RateLimiterOptions };
