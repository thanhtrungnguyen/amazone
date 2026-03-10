import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth configuration — no DB or Node.js-only imports.
 * Used by middleware.ts to verify JWT tokens without triggering DB connections.
 * The actual credential providers live in auth.ts (Node.js only).
 */
export const authConfig = {
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const protectedRoutes = ["/dashboard", "/admin", "/orders", "/settings", "/profile"];
      const adminRoutes = ["/admin"];
      const authRoutes = ["/sign-in", "/sign-up"];
      // Verification pages are publicly accessible (for both logged-in and logged-out users)
      const publicRoutes = ["/verify-email"];

      // Allow access to public routes for everyone
      if (publicRoutes.some((r) => pathname.startsWith(r))) {
        return true;
      }

      // Redirect logged-in users away from auth pages
      if (authRoutes.some((r) => pathname.startsWith(r))) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Protect restricted routes
      if (protectedRoutes.some((r) => pathname.startsWith(r))) {
        if (!isLoggedIn) return false; // NextAuth redirects to signIn page

        // Admin-only routes
        if (adminRoutes.some((r) => pathname.startsWith(r))) {
          const role = (auth?.user as { role?: string })?.role;
          if (role !== "admin") {
            return Response.redirect(new URL("/", nextUrl));
          }
        }
      }

      return true;
    },
  },
  providers: [], // Filled in auth.ts with actual credential providers
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
