Write tests for the amazone monorepo.

What to test: $ARGUMENTS

You are an expert engineer — write thorough, meaningful tests.

Follow these rules:

1. Use Vitest with React Testing Library for components
2. Place tests next to source: `<filename>.test.ts(x)` within the relevant package
3. Each package can be tested independently: `npx nx test <package-name>`
4. Run all tests: `npx nx run-many -t test`

Test categories:

- **Unit tests** (in domain packages): Business logic, price calculations, Zod schema validation
- **Component tests** (in shared-ui or apps/web): Render, interactions, states
- **Integration tests** (in domain packages): Server actions with mocked DB
- **API route tests** (in apps/web): Route handlers with mocked domain functions

Rules:
- Mock `@amazone/db` when testing domain packages — never hit real DB
- Mock domain packages when testing app pages/routes
- Test user-visible behavior, not implementation details
- Test loading, error, and empty states
- Verify accessibility (roles, labels)

After writing, run `npx nx affected -t test` and report results.
