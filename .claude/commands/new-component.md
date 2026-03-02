Create a new React component in the amazone monorepo.

Component description: $ARGUMENTS

You are an expert engineer — write production-quality, accessible, responsive code.

Follow these rules:

1. Determine the correct location:
   - Shared across domains → `packages/shared-ui/src/components/`
   - Domain-specific reusable → `packages/<domain>/src/components/`
   - App-specific/composed → `apps/web/src/components/`
2. Use TypeScript with explicit prop interface
3. Default to server components unless client interactivity is needed
4. Use shadcn/ui primitives where applicable
5. Tailwind CSS only — mobile-first responsive
6. Include aria labels and semantic HTML
7. Export from the package's barrel `index.ts`
8. If adding to `@amazone/shared-ui`, ensure it has no domain-specific imports

After creating, explain where it lives in the monorepo and how to import it.
