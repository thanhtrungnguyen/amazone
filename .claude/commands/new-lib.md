Create a new package/library in the amazone Nx monorepo.

Library description: $ARGUMENTS

You are an expert engineer — create well-structured, properly configured packages.

Follow these steps:

1. Create the package directory at `packages/<name>/`
2. Create `package.json`:
   ```json
   {
     "name": "@amazone/<name>",
     "version": "0.0.1",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "scripts": {
       "lint": "eslint src/",
       "test": "vitest run"
     }
   }
   ```
3. Create `tsconfig.json` extending root `tsconfig.base.json`
4. Create `src/index.ts` barrel export
5. Add path alias in root `tsconfig.base.json`: `"@amazone/<name>": ["packages/<name>/src/index.ts"]`
6. Create initial source files based on the library's purpose
7. Document allowed dependencies (what this package can import)

After creating, explain the package's role and how other packages should consume it.
