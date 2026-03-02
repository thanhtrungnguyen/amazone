Analyze and run tasks on affected packages in the amazone monorepo.

Task: $ARGUMENTS

Available operations:
- `build` — Build only changed packages
- `test` — Test only changed packages
- `lint` — Lint only changed packages
- `all` — Run build + test + lint on affected

Steps:
1. Run `npx nx affected -t <task>` with the specified operation
2. If errors occur, analyze and fix them
3. Show which packages were affected and why (trace the dependency chain)
4. Report results: passed, failed, skipped

If no argument provided, default to showing which packages are affected:
- Run `npx nx affected --print-affected`
- Explain the dependency chain that caused each package to be affected
