# Architecture Decisions

## Monorepo Structure

Package-based Nx monorepo with strict boundaries:

```
apps/web          → imports any @amazone/* package
packages/checkout → @amazone/cart, @amazone/orders, @amazone/db
packages/cart     → @amazone/products, @amazone/db
packages/orders   → @amazone/products, @amazone/db
packages/products → @amazone/db
packages/reviews  → @amazone/products, @amazone/db
packages/users    → @amazone/db
packages/shared-ui → @amazone/shared-utils
packages/*        → @amazone/shared-utils (any)
```

**Rule**: Packages never import from `apps/web`. Domain packages don't cross-import unless explicitly declared above.

## Server vs Client Split

- Server components by default (Next.js 16 / React 19)
- `"use client"` only for: forms with state, event handlers, browser APIs, Zustand stores
- Server actions defined in domain packages, called from pages
- API routes only for: Stripe webhooks, external integrations

## Data Layer

- Drizzle ORM for all DB access
- Queries in `packages/db/src/queries/<domain>.ts`
- Schema in `packages/db/src/schema.ts`
- Money stored as integer cents — formatted to dollars only in UI
- Cursor-based pagination for lists

## State Management

- **Server**: Server Actions for mutations, React Server Components for reads
- **Client**: Zustand for cart, UI state. Named `use<Name>Store`
- Cart is optimistic — update UI immediately, sync with server

## i18n Architecture

- Locale detection: URL path → cookie → Accept-Language → default (en)
- Server-side dictionary loading (no client bundle bloat)
- Product/category translations in separate DB tables
- Error messages as translation keys, not hardcoded strings
