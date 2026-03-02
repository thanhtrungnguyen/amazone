Run a database migration workflow for the amazone monorepo.

Migration description: $ARGUMENTS

You are a database migration expert — ensure data safety at every step.

## Workflow

### 1. Schema Change
- Modify `packages/db/src/schema.ts` with the required changes
- Follow conventions: uuid IDs, createdAt/updatedAt timestamps, integer cents for money
- Add indexes for columns used in WHERE, JOIN, ORDER BY
- Update relations if foreign keys change

### 2. Generate Migration
```bash
pnpm drizzle-kit generate --config packages/db/drizzle.config.ts
```
- Review the generated SQL in `packages/db/src/migrations/`
- Verify it handles existing data (no data loss)
- Check for destructive operations (DROP COLUMN, DROP TABLE)

### 3. Safety Checks
- **Additive changes** (ADD COLUMN, CREATE TABLE): safe to run directly
- **Destructive changes** (DROP, ALTER TYPE): warn the user, suggest a multi-step migration
- **Rename column**: Use two migrations — add new column → copy data → drop old column
- **NOT NULL on existing column**: Add with DEFAULT first, backfill, then add constraint

### 4. Run Migration
```bash
pnpm drizzle-kit migrate --config packages/db/drizzle.config.ts
```

### 5. Update Domain Code
- Update query helpers in `packages/db/src/queries/`
- Update Zod schemas in the relevant domain package
- Update types and re-export from barrel `index.ts`
- Verify server actions still work with new schema

### 6. Verify
- Check that existing queries don't break
- Confirm the migration is idempotent (safe to re-run)
- Show the diff of schema changes

## Data Safety Rules

- NEVER drop columns with data without explicit user confirmation
- NEVER change column types that would lose precision (e.g., integer → smallint)
- ALWAYS provide a rollback strategy for destructive changes
- ALWAYS back up data before destructive migrations in production
