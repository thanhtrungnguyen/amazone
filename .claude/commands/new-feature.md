Implement a complete e-commerce feature end-to-end in the amazone Nx monorepo.

Feature description: $ARGUMENTS

You are an expert engineer — write production-quality, well-architected code following monorepo boundaries.

Implementation sequence:

1. **Plan**: Identify which packages need changes, what new types/actions/components are needed
2. **Database** (`@amazone/db`): Add/modify schema tables, create query helpers
3. **Domain logic** (e.g., `@amazone/products`): Add types, Zod schemas, server actions
4. **Shared UI** (`@amazone/shared-ui`): Build reusable components if used across domains
5. **App pages** (`apps/web`): Compose domain imports into pages with proper layouts
6. **Client state** (`apps/web/src/stores/`): Zustand stores if needed
7. **Verify boundaries**: Ensure no circular deps, run `npx nx graph` mentally

Package boundary rules:
- Pages in `apps/web` import from `@amazone/*` packages
- Domain packages import `@amazone/db` and `@amazone/shared-utils`
- Domain packages do NOT import from `apps/web` or from each other (unless declared dependency)

Design principles:
- Amazon-like UX: information-dense, fast navigation, prominent CTAs
- Mobile-first responsive
- Optimistic UI for cart/wishlist actions
- Skeleton loading states for async content
- Accessible (keyboard nav, screen reader friendly)

After implementation, summarize packages touched and any manual steps needed.
