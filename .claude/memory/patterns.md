# Code Patterns & Conventions

## Naming

| Entity | Convention | Example |
|---|---|---|
| Package | `@amazone/<name>` | `@amazone/products` |
| File | `kebab-case.ts` | `product-card.tsx` |
| Component | `PascalCase` | `ProductCard` |
| DB table | `snake_case` plural | `order_items` |
| Server action | `camelCase` verb | `addToCart` |
| Zustand store | `use<Name>Store` | `useCartStore` |

## Server Action Pattern

```typescript
"use server"

export async function createProduct(input: CreateProductInput): Promise<ActionResult<Product>> {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.message }

  try {
    const product = await db.insert(products).values(parsed.data).returning()
    return { success: true, data: product[0] }
  } catch (error) {
    console.error("createProduct failed:", error)
    return { success: false, error: "Failed to create product" }
  }
}
```

## React 19 Patterns (Next.js 16)

- `useActionState` for form mutations (replaces `useFormState`)
- `useOptimistic` for cart/wishlist optimistic UI
- `use cache` directive for server component caching
- `<form action={serverAction}>` for progressive enhancement
- `use()` hook for reading promises in client components

## DB Schema Pattern

Every table includes:
- `id` — uuid, primaryKey, defaultRandom
- `createdAt` — timestamp, defaultNow
- `updatedAt` — timestamp, defaultNow, onUpdate

Money fields: `integer` (cents), never float/decimal.

## Error Handling

- Server actions: return `{ success: false, error }` — never throw
- Pages: `error.tsx` boundary
- User feedback: shadcn toast notifications
- Stripe errors: catch and map to user-friendly messages

## Test Patterns

- Vitest + React Testing Library for unit/component tests
- Playwright for E2E (critical user journeys)
- `@axe-core/playwright` for accessibility
- Mock `@amazone/db` in domain package tests
- Mock domain packages in `apps/web` tests
- Test files next to source: `<filename>.test.ts(x)`
