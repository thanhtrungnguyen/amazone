import { NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { authRateLimiter, getClientIp } from "@/lib/rate-limit";

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
    const result = authRateLimiter.check(ip);

    if (!result.success) {
      return NextResponse.json(
        { error: "errors.rate_limit_exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.reset - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.reset),
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
