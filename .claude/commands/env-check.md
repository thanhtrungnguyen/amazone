Validate environment variables for the amazone monorepo.

Scope (optional): $ARGUMENTS

You are a deployment safety expert — catch missing config before it causes runtime errors.

## Validation Steps

### 1. Inventory Required Variables
Scan the codebase for `process.env.*` usage across:
- `apps/web/` — Next.js app
- `packages/db/` — Database connection
- `packages/checkout/` — Stripe keys
- `packages/users/` — Auth config

### 2. Cross-Reference with .env.example
Compare found variables against `.env.example`:
- **Missing from .env.example**: Variable used in code but not documented
- **Extra in .env.example**: Variable documented but never referenced in code
- **Naming inconsistency**: Variables that don't follow `UPPER_SNAKE_CASE`

### 3. Validate Variable Categories

**Database**:
- `DATABASE_URL` — valid PostgreSQL connection string format
- Check for hardcoded `localhost` in non-development contexts

**Auth (NextAuth)**:
- `NEXTAUTH_SECRET` — must be set (not empty)
- `NEXTAUTH_URL` — valid URL format
- `AUTH_*` provider variables (Google, GitHub, etc.)

**Stripe**:
- `STRIPE_SECRET_KEY` — starts with `sk_test_` or `sk_live_`
- `STRIPE_PUBLISHABLE_KEY` — starts with `pk_test_` or `pk_live_`
- `STRIPE_WEBHOOK_SECRET` — starts with `whsec_`
- Warn if test keys mixed with live keys

**Next.js**:
- `NEXT_PUBLIC_*` — verify only non-sensitive values are public
- Warn if secrets use `NEXT_PUBLIC_` prefix (exposed to client)

### 4. Security Checks
- No secrets in `NEXT_PUBLIC_*` variables
- No `.env` files committed to git (check `.gitignore`)
- No hardcoded secrets in source code (scan for API keys, passwords)
- Verify `.env.local` is gitignored

## Output

Report as a checklist:
- [x] Variable present and valid
- [ ] Variable missing or invalid — with fix instructions
- [!] Security concern — with severity and remediation
