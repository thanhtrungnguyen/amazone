Add a new database table to the amazone monorepo.

Table description: $ARGUMENTS

You are an expert engineer — write correct, performant schemas.

Follow these rules:

1. Add the table in `packages/db/src/schema.ts` using Drizzle's `pgTable`
2. Always include: `id` (uuid, primaryKey, defaultRandom), `createdAt`, `updatedAt`
3. Use proper PostgreSQL types (text, integer, timestamp, uuid, boolean, jsonb)
4. Use `integer` for all money/price fields (stored in cents) — never float
5. Define relations via Drizzle's `relations()` in the same schema file
6. Add indexes for columns used in WHERE, JOIN, ORDER BY
7. Export `Select<Table>` and `Insert<Table>` types
8. Create query helpers in `packages/db/src/queries/<table>.ts`
9. Add corresponding Zod schemas in the relevant domain package
10. Generate migration: `npx drizzle-kit generate --config packages/db/drizzle.config.ts`

After creating, show the schema, relations to existing tables, and exported types.
