Audit and manage dependencies across the amazone Nx monorepo.

Action (optional): $ARGUMENTS

You are a dependency management expert — keep the monorepo lean and secure.

## Available Actions

### Audit (default)
Scan all `package.json` files across the monorepo:

1. **Duplicates**: Same dependency at different versions across packages
2. **Unused**: Dependencies listed in `package.json` but never imported in source
3. **Missing**: Imports in source with no corresponding `package.json` entry
4. **Outdated**: Check for major version updates available
5. **Security**: Known vulnerabilities via `pnpm audit`

### Dedup
Find and resolve duplicate dependency versions:
```bash
pnpm dedupe
```
Ensure a single version is used across all packages where possible.

### Update
Update dependencies safely:
- **Patch/minor** updates: safe to apply automatically
- **Major** updates: list breaking changes and require confirmation
- Use `pnpm update` for compatible updates
- Use `pnpm update --latest` for major updates (with caution)

### Check Package Boundaries
Verify Nx dependency rules are respected:
- Domain packages only import allowed dependencies
- No circular dependencies between packages
- `shared-ui` and `shared-utils` don't import domain packages
- Run `pnpm nx graph` to visualize and validate

## Files to Scan
- `package.json` (root)
- `apps/web/package.json`
- `packages/*/package.json`
- `pnpm-lock.yaml` (for version resolution)

## Rules
- Always use pnpm — never npm or yarn
- Prefer `workspace:*` for internal `@amazone/*` dependencies
- Keep devDependencies at root level when shared across packages
- Production dependencies go in the package that uses them
- Pin exact versions for critical dependencies (Stripe, NextAuth)

## Output
Report as:
- **Action needed**: specific command to run
- **Warning**: potential issue to investigate
- **Info**: optimization suggestion
