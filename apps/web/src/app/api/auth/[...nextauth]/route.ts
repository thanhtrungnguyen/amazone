import { NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { authLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * Rate-limiting wrapper for auth route handlers.
 *
 * Rate limiting is applied at the API route level (not middleware) because
 * the Edge Runtime used by middleware does not support in-memory Maps or
 * Node.js timers required by the rate limiter.
 *
 * Limit: 10 requests per minute per client IP.
 */
function withRateLimit(
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const ip = getClientIp(req);
    const result = await authLimiter.check(ip);

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
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.resetAt.getTime()),
          },
        },
      );
    }

    const response = await handler(req);
    return response;
  };
}

export const GET = withRateLimit(handlers.GET as (req: Request) => Promise<Response>);
export const POST = withRateLimit(handlers.POST as (req: Request) => Promise<Response>);
