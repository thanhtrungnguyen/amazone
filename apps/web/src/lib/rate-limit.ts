import { NextRequest, NextResponse } from "next/server";
import {
  createRateLimiter,
  type RateLimitResult,
} from "@amazone/shared-utils";

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

/** General API routes: 100 req/min per IP */
export const apiLimiter = createRateLimiter("api", {
  limit: 100,
  windowSec: 60,
});

/** Auth endpoints: 10 req/min per IP */
export const authLimiter = createRateLimiter("auth", {
  limit: 10,
  windowSec: 60,
});

/** Stripe webhooks: 50 req/min per IP */
export const webhookLimiter = createRateLimiter("webhook", {
  limit: 50,
  windowSec: 60,
});

// Keep the old name around so existing imports in the auth route still work.
export const authRateLimiter = authLimiter;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract client IP from request headers.
 * Falls back to "unknown" when IP cannot be determined.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * Rate-limit guard for Next.js API route handlers.
 *
 * Returns a 429 NextResponse when the limit is exceeded, or `null` if the
 * request is allowed to proceed.
 */
export async function withRateLimit(
  request: NextRequest | Request,
  limiter: ReturnType<typeof createRateLimiter>,
  configLimit?: number,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result: RateLimitResult = await limiter.check(ip);

  if (!result.success) {
    const retryAfter = Math.ceil(
      (result.resetAt.getTime() - Date.now()) / 1000,
    );
    return NextResponse.json(
      { error: "errors.rate_limit_exceeded" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(retryAfter, 1)),
          "X-RateLimit-Limit": String(configLimit ?? "unknown"),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.resetAt.getTime()),
        },
      },
    );
  }

  return null;
}

export type { RateLimitResult };
