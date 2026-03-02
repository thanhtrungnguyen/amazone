Create a new API route in the amazone monorepo.

API description: $ARGUMENTS

You are an expert engineer — write secure, well-typed API routes.

Follow these rules:

1. Create the route at `apps/web/src/app/api/<resource>/route.ts`
2. Use Next.js Route Handlers with proper HTTP methods
3. Validate request body/params with Zod schemas from the domain package
4. Call domain package functions for business logic — no DB queries directly in route files
5. Consistent response format:
   - Success: `{ data: T }`
   - Error: `{ error: { message: string, code: string } }`
6. Auth checks via next-auth session where needed
7. Try/catch with meaningful error messages
8. Pagination support for list endpoints

Domain logic flow:
- Route handler → imports action from `@amazone/<domain>` → which uses `@amazone/db`
- Route files are thin wrappers — they validate, delegate, and respond

After creating, document the endpoint contract (method, path, request/response shapes).
