Prepare the amazone monorepo for deployment.

Target: $ARGUMENTS

You are an expert engineer — ensure production readiness.

Checklist:

1. Run `npx nx run-many -t build` — fix all TypeScript and build errors
2. Run `npx nx run-many -t lint` — fix all lint issues
3. Run `npx nx run-many -t test` — all tests must pass
4. Verify all env vars documented in `.env.example`
5. Check Drizzle migrations are up to date
6. No hardcoded localhost URLs in production code
7. Stripe webhook configured for production URL
8. NextAuth callback URLs set for production domain
9. `next.config.ts` has proper image domains and security headers
10. Auth middleware protects admin and dashboard routes
11. Verify package boundaries are clean: `npx nx graph`

For Vercel:
- Ensure `apps/web` is the build target
- DATABASE_URL uses connection pooling for serverless
- Set `NEXTAUTH_URL` to production domain

Report issues found and fixes applied.
