Initialize the amazone e-commerce Nx monorepo from scratch. You are an expert-level engineer — write production-quality code with proper types, error handling, and clean architecture.

Follow these steps in order:

1. Create an Nx workspace (package-based) in the current directory:
   - `pnpm dlx create-nx-workspace@latest amazone --preset=npm --workspaceType=package-based --nxCloud=skip --packageManager=pnpm`
   - Move generated files to the current directory if needed

2. Create the Next.js app at `apps/web/`:
   - Initialize Next.js 16 with App Router, React 19, TypeScript, Tailwind CSS, `src/` directory
   - Turbopack is the default bundler — no extra config needed
   - Configure `next.config.ts` to support package imports from `packages/*`
   - Add Nx plugin: `@nx/next`

3. Install root dependencies with pnpm:
   - `pnpm add drizzle-orm postgres zod zustand lucide-react stripe @stripe/stripe-js`
   - `pnpm add -D drizzle-kit @types/node typescript`
   - `pnpm add next-auth@beta @auth/core` (in apps/web)

4. Initialize shadcn/ui in `apps/web/` and add: button, input, card, dialog, dropdown-menu, sheet, badge, separator, skeleton, toast, avatar, tabs, command, popover

5. Scaffold all domain packages under `packages/`:

   Each package gets: `package.json` (name: `@amazone/<name>`), `tsconfig.json`, `src/index.ts`

   - `@amazone/db` — Drizzle schema, connection, queries, migrations
   - `@amazone/products` — Product types, schemas, actions
   - `@amazone/cart` — Cart types, schemas, actions
   - `@amazone/checkout` — Checkout flow, Stripe integration
   - `@amazone/orders` — Order management, status machine
   - `@amazone/users` — User profiles, auth utilities
   - `@amazone/reviews` — Reviews and ratings
   - `@amazone/shared-ui` — Shared components
   - `@amazone/shared-utils` — Formatters, constants, helpers

6. Configure workspace:
   - `pnpm-workspace.yaml` with `apps/*` and `packages/*`
   - `tsconfig.base.json` with path aliases for all `@amazone/*` packages
   - `nx.json` with targetDefaults for build, lint, test
   - Root `package.json` with pnpm as package manager

7. Create `.env.example`:

   ```text
   DATABASE_URL=postgresql://user:password@localhost:5432/amazone
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

8. Set up the `@amazone/db` package:
   - `drizzle.config.ts` at package root
   - `src/index.ts` — DB connection using postgres driver
   - `src/schema.ts` — Initial schema with: users, products, categories, cart_items, orders, order_items, reviews tables
   - All tables include id (uuid), createdAt, updatedAt
   - Define relations between all tables

9. Update `.gitignore` for Nx + Next.js + env files + pnpm

Report what was created and show the dependency graph structure.
