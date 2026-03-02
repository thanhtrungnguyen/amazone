Run a comprehensive security audit of the amazone e-commerce monorepo.

Focus area (optional): $ARGUMENTS

You are a senior application security engineer — find real vulnerabilities, not theoretical concerns.

## Audit Checklist

### 1. Hardcoded Secrets
Scan the entire codebase for:
- API keys, tokens, passwords in source files (not .env)
- Stripe keys (`sk_live_`, `sk_test_`, `pk_live_`, `whsec_`) in code
- Database connection strings in source code
- JWT secrets or auth tokens hardcoded
- Private keys (RSA, SSH)

Search patterns:
- `password\s*=\s*['"][^'"]+['"]`
- `(sk|pk)_(live|test)_[a-zA-Z0-9]+`
- `whsec_[a-zA-Z0-9]+`
- `(api[_-]?key|secret|token)\s*[:=]\s*['"][^'"]+['"]`
- `postgresql://[^@]+@`

### 2. SQL Injection
Scan Drizzle queries in `packages/db/src/queries/` for:
- Use of `sql.raw()` with user input
- String concatenation in `sql` tagged template literals
- Dynamic table/column names from user input
- Missing parameterization in raw queries

### 3. XSS / Content Injection
Check for:
- `dangerouslySetInnerHTML` usage without sanitization
- User-generated content (reviews, product descriptions) rendered without escaping
- Unsanitized URL parameters rendered in pages
- Missing Content-Security-Policy headers in `next.config.ts`

### 4. Stripe Webhook Security
Verify in `apps/web/src/app/api/webhooks/stripe/`:
- Signature verification with `stripe.webhooks.constructEvent()`
- Raw body parsing (not JSON parsed before verification)
- Idempotency handling (store processed event IDs)
- Appropriate error responses (200 on success, even on processing errors)

### 5. Authentication & Authorization
Check for:
- Protected routes without auth middleware
- Server actions without session validation
- Direct object access without ownership checks (IDOR)
- Missing CSRF protection on state-changing operations

### 6. Rate Limiting
Verify rate limiting exists on:
- Authentication endpoints (sign-in, sign-up, password reset)
- Checkout and payment creation
- Review submission
- Search and API endpoints

### 7. OWASP Top 10 Quick Check
- A01 Broken Access Control: auth checks on all protected routes
- A02 Cryptographic Failures: password hashing (bcrypt), HTTPS only
- A03 Injection: parameterized queries only
- A04 Insecure Design: order state machine validation
- A05 Security Misconfiguration: env vars not in code, strict CSP
- A07 Cross-Site Scripting: output encoding, no dangerouslySetInnerHTML
- A09 Security Logging: audit trail for payment events

### 8. Dependency Vulnerabilities
Run: `pnpm audit --audit-level=high`
Flag any known CVEs in direct dependencies.

## Output

Report findings by severity:
- **CRITICAL**: Exploitable now (hardcoded secrets, missing auth, SQL injection)
- **HIGH**: Exploitable with effort (XSS, missing rate limits, IDOR)
- **MEDIUM**: Defense-in-depth gaps (missing CSP, no audit logging)
- **LOW**: Best practice improvements

For each finding include: **Location** (file:line), **Issue**, **Risk**, **Fix**.
