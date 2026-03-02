import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Middleware uses the Edge-safe auth config (no DB providers).
 * It only verifies JWT tokens from cookies — no database access needed.
 * The authorized() callback in authConfig handles route protection logic.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
