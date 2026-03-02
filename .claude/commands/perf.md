Audit performance of the amazone e-commerce monorepo.

Focus area (optional): $ARGUMENTS

You are a performance expert — identify bottlenecks, not hypothetical issues.

## Audit Checklist

### Build Performance
- Check `pnpm nx build web` output size and timing
- Identify large dependencies with `pnpm nx build web --analyze` or bundle analysis
- Verify tree-shaking — are unused exports eliminated?
- Check for duplicate dependencies across packages
- Verify Turbopack is enabled for dev server

### Runtime Performance
- **N+1 queries**: Scan Drizzle queries in `packages/db/src/queries/` — find loops that should be batch queries
- **Missing indexes**: Cross-reference `WHERE` and `ORDER BY` columns against schema indexes
- **Unnecessary `"use client"`**: Flag client components that could be server components
- **Unoptimized images**: Verify all `<img>` tags use `next/image` with width/height
- **Large client bundles**: Check for heavy imports in `"use client"` files (moment, lodash full, etc.)

### Data Fetching
- Verify parallel data fetching with `Promise.all` where independent
- Check for waterfall requests (sequential fetches that could be parallel)
- Validate `loading.tsx` exists for pages with async data
- Confirm ISR/revalidation is set on product listing pages
- Check cursor-based pagination is used (not offset-based)

### Caching
- Review Next.js caching strategy (`fetch` cache, `unstable_cache`, `use cache`)
- Check `revalidatePath`/`revalidateTag` usage after mutations
- Verify static generation where possible (product categories, static pages)

### Client-Side
- Check Zustand store size — avoid storing large datasets client-side
- Verify React key usage in lists (no index-as-key for dynamic lists)
- Check for unnecessary re-renders (missing `React.memo`, unstable references)
- Verify lazy loading for below-fold components

## Output Format

Report findings as:
- **Critical** (blocking perf): issue + fix
- **Warning** (noticeable impact): issue + recommendation
- **Info** (minor optimization): issue + suggestion

Include before/after estimates where measurable.
