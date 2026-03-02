Create or update the database seed script for the amazone monorepo.

Context: $ARGUMENTS

You are an expert engineer — create realistic, comprehensive seed data.

Create the seed script at `packages/db/src/seed.ts`:

1. Import the Drizzle db instance and all schema tables from `@amazone/db`
2. Clear existing data in correct foreign key order
3. Create realistic e-commerce sample data:
   - 8+ product categories (Electronics, Clothing, Home & Kitchen, Books, Sports, Beauty, Toys, Automotive)
   - 30+ products with varied prices, descriptions, image placeholder URLs, stock quantities
   - 5 test users: admin, 2 sellers, 2 buyers (with bcrypt-hashed passwords)
   - Sample reviews and ratings (varied 1-5 stars with realistic text)
   - Sample orders in various statuses (pending, processing, shipped, delivered, cancelled)
   - Cart items for the buyer accounts
4. Use transactions for data integrity
5. Log progress per table
6. Add script in root `package.json`: `"db:seed": "pnpm tsx packages/db/src/seed.ts"`

Use realistic product names and prices that make the store look believable.
