# Amazone Project — TODO Tasks

> Auto-generated on 2026-03-06 by scanning the full codebase for explicit TODO
> markers, stub/placeholder code, missing features referenced in CLAUDE.md, and
> dead links in the navigation.

---

## 1. Explicit TODO / FIXME Markers

| # | File | Line | Description |
|---|------|------|-------------|
| 1 | `apps/web/src/lib/auth.ts` | 33 | **TODO: Replace with proper bcrypt comparison** — password validation is completely skipped; any password is accepted. |

---

## 2. Stub / Placeholder Implementations

### 2.1 Checkout is stubbed (no Stripe redirect)
- **File:** `apps/web/src/app/(shop)/checkout/checkout-form.tsx:100-103`
- The form simulates order placement with a `setTimeout(1500)` instead of calling `createCheckoutSession`.
- **Fix:** Wire up the real `createCheckoutSession` server action from `@amazone/checkout` and redirect to Stripe Checkout.

### 2.2 Stripe stub mode in checkout actions
- **File:** `packages/checkout/src/actions.ts:69-75`
- When `STRIPE_SECRET_KEY` is missing, returns a fake `stub_<id>` session ID.
- **Fix:** Acceptable for dev, but needs clear error UX in production.

### 2.3 Placeholder data throughout the storefront
Pages fall back to hardcoded placeholder arrays when the DB is not connected:

| File | Description |
|------|-------------|
| `apps/web/src/app/(shop)/page.tsx:78-137` | Featured products on homepage |
| `apps/web/src/app/(shop)/products/page.tsx:29-223` | Product listing page |
| `apps/web/src/app/(shop)/products/[slug]/page.tsx:33-72` | Product detail page |
| `apps/web/src/app/(shop)/products/[slug]/product-reviews.tsx:30-104` | Product reviews |
| `apps/web/src/app/dashboard/products/page.tsx:32-95` | Seller dashboard products |
| `apps/web/src/app/dashboard/orders/page.tsx:25-75` | Seller dashboard orders |

### 2.4 Seed data uses placeholder password hash
- **File:** `packages/db/src/seed.ts:43-64`
- Uses a static `PLACEHOLDER_PASSWORD_HASH` instead of actually hashing passwords with bcrypt.

---

## 3. Missing Pages (Dead Navigation Links)

The header, footer, and sidebar navigation link to pages that do **not** exist:

| Link | Referenced In | Status |
|------|--------------|--------|
| `/orders` (My Orders) | `site-header.tsx`, `site-footer.tsx` | **Missing** — no route exists |
| `/wishlist` | `site-footer.tsx` | **Missing** — no route, no schema, no logic |
| `/settings` | `site-footer.tsx` | **Missing** — no user settings page |
| `/admin/orders` | `admin/layout.tsx` | **Missing** — only `/admin/page.tsx` exists |
| `/admin/settings` | `admin/layout.tsx` | **Missing** — no admin settings page |
| `/dashboard/settings` | `dashboard/layout.tsx` | **Missing** — no seller settings page |

---

## 4. Admin Panel — Incomplete

- **File:** `apps/web/src/app/admin/page.tsx`
- Only a static overview page with hardcoded `0` values.
- **Missing:**
  - Real data queries for user count, product count, order count, pending reviews
  - `/admin/orders` — order management page
  - `/admin/users` — user management page
  - `/admin/settings` — platform settings page
  - Role-based access control enforcement (admin-only middleware)

---

## 5. Authentication — Security Gap

- **File:** `apps/web/src/lib/auth.ts:33-35`
- Password comparison is commented out. **Any password will authenticate any user.**
- **Fix:** Install `bcryptjs` (or `bcrypt`) and implement:
  ```ts
  import bcrypt from "bcryptjs";
  const isValid = await bcrypt.compare(credentials.password as string, user.hashedPassword);
  if (!isValid) return null;
  ```

---

## 6. Missing Test Coverage

**Zero unit/integration tests exist.** Only 3 E2E Playwright specs:
- `e2e/navigation.spec.ts`
- `e2e/home.spec.ts`
- `e2e/a11y.spec.ts`

### Tests needed:

| Package | Tests to Write |
|---------|---------------|
| `@amazone/products` | CRUD actions, Zod schema validation, search/filter logic |
| `@amazone/cart` | Add/update/remove/clear actions, cart summary calculation |
| `@amazone/checkout` | Checkout session creation, Stripe webhook handling |
| `@amazone/orders` | Order creation, status transitions |
| `@amazone/users` | User queries, profile updates |
| `@amazone/reviews` | Review CRUD, rating aggregation |
| `@amazone/shared-utils` | `formatPrice`, `centsToDollars`, constants |
| `apps/web` | Component tests for checkout form, cart drawer, product pages |

---

## 7. Search — No Fuzzy Matching

- **File:** `apps/web/src/app/(shop)/products/product-search.tsx`
- **Current:** Basic `ilike` substring matching in PostgreSQL.
- **Missing per CLAUDE.md:** "Search supports fuzzy matching and category filtering"
- **Fix:** Add PostgreSQL `pg_trgm` extension for trigram similarity, or use a client-side library like Fuse.js, or integrate a search service.

---

## 8. Pagination — UI Not Wired

- **File:** `packages/products/src/actions.ts:108-115`
- Cursor-based pagination is implemented in the server action.
- **But:** The product listing page (`apps/web/src/app/(shop)/products/page.tsx`) does not pass cursor params or show pagination controls.
- **Fix:** Add "Load more" or infinite scroll using the existing cursor logic.

---

## 9. Missing Features (per CLAUDE.md)

| Feature | Status | Notes |
|---------|--------|-------|
| Optimistic cart UI | Partial | Zustand store exists, but no `useOptimistic` or server sync |
| ISR / `revalidatePath` | Missing | No `revalidate` exports or `revalidatePath` calls found |
| Prefetch product pages on hover | Missing | No `<Link prefetch>` or `router.prefetch` on product cards |
| Image alt text for accessibility | Partial | Some images use alt, others don't |
| `error.tsx` for all route groups | Partial | Missing for `(auth)`, `admin`, individual product pages |
| `loading.tsx` skeletons | Partial | Missing for `dashboard/products`, `dashboard/orders`, `admin` |
| Toast for user action feedback | Done | Using `sonner` |
| Inventory check at checkout | Missing | No stock validation before order placement |
| OAuth providers (Google, etc.) | Missing | Only credentials provider configured |
| Email verification | Missing | No email verification flow |
| Password reset | Missing | No forgot/reset password pages |
| Order confirmation page | Missing | Checkout redirects to `/` after success |
| Order tracking / status updates | Missing | No order status page for customers |

---

## 10. Summary — Priority Tasks

### Critical (Security / Broken)
1. Implement bcrypt password comparison in `auth.ts`
2. Wire checkout form to real Stripe session

### High Priority (Core Features)
3. Create `/orders` page (customer order history)
4. Create `/wishlist` page and DB schema
5. Add unit tests for all domain packages
6. Wire pagination controls on product listing
7. Add inventory check at checkout

### Medium Priority (Polish)
8. Implement fuzzy search
9. Create admin sub-pages (orders, users, settings)
10. Create dashboard/seller settings page
11. Add ISR with `revalidatePath` for product pages
12. Add `error.tsx` and `loading.tsx` for remaining routes
13. Add OAuth providers (Google)
14. Create order confirmation page

### Low Priority (Nice to Have)
15. Add password reset flow
16. Add email verification
17. Prefetch product pages on hover
18. Replace placeholder data with proper empty states
19. Add user profile/settings page
