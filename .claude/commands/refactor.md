Refactor code in the amazone monorepo following clean architecture principles.

Refactoring target: $ARGUMENTS

You are an expert architect — improve structure without changing behavior.

## Refactoring Approach

### 1. Understand Current State
- Read all files involved in the refactoring target
- Map the dependency chain (what imports what)
- Identify the public API surface (what's exported from barrel `index.ts`)
- Note any tests that cover the code being refactored

### 2. Identify Smells
- **God files**: Files > 300 lines that do too many things
- **Leaky abstractions**: Domain logic in `apps/web` that belongs in a package
- **Wrong boundaries**: Code in the wrong package per Nx dependency rules
- **Dead code**: Exports that nothing imports, unused variables
- **Inconsistent patterns**: Similar logic done differently across packages
- **Tight coupling**: Components that directly query DB instead of using domain actions
- **Missing types**: `any` types, untyped function parameters

### 3. Plan the Refactoring
- Break into small, safe steps (each step should compile and tests pass)
- Maintain backward compatibility during transition
- Update barrel exports (`index.ts`) as public API changes
- Update imports across all consumers

### 4. Execute
For each step:
1. Make the change
2. Verify TypeScript compiles: `pnpm nx run-many -t build`
3. Verify tests pass (if they exist)
4. Move to next step

### 5. Clean Up
- Remove any dead code introduced during transition
- Update barrel exports
- Verify no circular dependencies: `pnpm nx graph`

## Monorepo-Specific Rules
- Never move server actions from domain packages into `apps/web`
- Shared components used by 2+ domains go to `@amazone/shared-ui`
- Pure utility functions go to `@amazone/shared-utils`
- DB queries stay in `@amazone/db` — domain packages call query helpers
- Keep Zod schemas co-located with their types in domain packages

## Output
- Summary of changes made
- Files modified/created/deleted
- Any manual steps needed (run migrations, update imports, etc.)
