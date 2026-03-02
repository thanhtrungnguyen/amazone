Create a new Next.js App Router page in the amazone monorepo.

Page name: $ARGUMENTS

You are an expert engineer — write production-quality code with clean architecture.

Follow these rules:

1. Create the page at `apps/web/src/app/<page-name>/page.tsx`
2. Use server components by default; only add `"use client"` if interactivity is needed
3. Include proper metadata export for SEO (title, description, openGraph)
4. Import domain logic from `@amazone/*` packages — never write business logic in the page file
5. Import shared UI from `@amazone/shared-ui` for reusable components
6. Use shadcn/ui components and Tailwind CSS for styling
7. Add `loading.tsx` skeleton for async data pages
8. Add `error.tsx` boundary for dynamic pages
9. Match the Amazon-like design: clean, dense product info, prominent CTAs
10. If the page needs new server actions, create them in the appropriate domain package

After creating, explain the component structure and data flow through the monorepo packages.
