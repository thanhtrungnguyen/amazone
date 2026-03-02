Review code quality in the amazone monorepo.

What to review: $ARGUMENTS

You are an expert reviewer — find real issues, not style nitpicks.

Check for:

**Monorepo Architecture**

- Package boundary violations (importing across undeclared deps)
- Circular dependencies between packages
- Business logic leaking into `apps/web` (should be in domain packages)
- Missing barrel exports in package `index.ts`

**Security**

- SQL injection via unsanitized Drizzle inputs
- XSS in user-generated content (reviews, product descriptions)
- Auth checks on protected routes and server actions
- Stripe webhook signature verification
- Rate limiting on auth and checkout

**E-Commerce Logic**

- Price calculation correctness (integer cents, no floats)
- Inventory race conditions
- Order state machine validity
- Payment + order creation atomicity

**Performance**

- N+1 queries in product listings
- Missing DB indexes
- Unnecessary `"use client"` directives (bundle size)
- Unoptimized images

**Code Quality**

- TypeScript strictness (no `any`, proper null checks)
- Consistent error handling
- Proper server vs client component split

Report with severity (critical, warning, info) and suggested fixes.
