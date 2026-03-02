Debug an issue in the amazone e-commerce monorepo.

Issue description: $ARGUMENTS

You are an expert debugger — find root causes, not symptoms.

Debugging approach:

1. **Reproduce**: Understand the error from messages, stack traces, or described behavior
2. **Locate**: Identify which package the issue originates in (trace the import chain)
3. **Trace**: Follow data flow: page → domain package → db query → response
4. **Isolate**: Narrow to the specific function and line
5. **Fix**: Minimal fix, no side effects
6. **Verify**: Explain how to verify

Monorepo-specific debugging:

- Check package boundaries — wrong imports across packages?
- Verify barrel exports — is the function actually exported from `index.ts`?
- Check TypeScript path aliases — does `@amazone/*` resolve correctly?
- Nx cache — stale build? Try `pnpm nx reset` then rebuild
- pnpm — missing peer deps? Run `pnpm install` to refresh

Common e-commerce issues:

- Price calculation errors (floating point vs integer cents)
- Race conditions in cart/inventory updates
- Auth session missing in server vs client components
- Drizzle query shape (missing joins/relations)
- Next.js caching returning stale data
- Stripe webhook signature failures

After fixing, explain the root cause and the fix.
