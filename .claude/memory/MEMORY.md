# Project Memory

> Persistent knowledge base for the amazone e-commerce platform.
> Updated as the project evolves. See topic files for details.

## Tech Stack Versions

- **Next.js**: 16 (React 19, Turbopack default, `use cache`)
- **Nx**: 22
- **PostgreSQL**: 18
- **Redis**: 8
- **Node.js**: 24 (Alpine for Docker)
- **Drizzle ORM**: latest
- **NextAuth.js**: v5 (beta)
- **Stripe**: latest SDK

## .claude Setup Summary

- **7 agents**: db-architect, frontend-dev, payments-agent, domain-logic, devops, qa-tester, researcher
- **24 commands**: setup, new-feature, new-page, new-component, new-api, new-lib, db-table, db-seed, test, debug, review, deploy, affected, perf, migrate, env-check, a11y, deps, refactor, docker, stripe-test, i18n, audit-security, fix-env
- **Hooks**: PreToolUse on Edit/Write (no .env, no any, no console.log, no boundary violations), PreToolUse on Bash (no npm/yarn, no force push, no docker rm), PostToolUse prompt-based boundary check
- **Auto-approve**: Read, Edit, Write, Glob, Grep, WebFetch, WebSearch, TodoWrite + all pnpm/git/docker/gh commands
- **Deny list**: rm -rf, git push --force/-f, git reset --hard, DROP TABLE/DATABASE, npm, yarn, chmod 777, docker compose down -v, docker compose rm, rm .env*
- **`.claudeignore`**: excludes node_modules, .next, dist, .nx, pnpm-lock.yaml, migrations, coverage, storybook-static, docker volumes

## i18n

- Supported locales: `en` (English), `vi` (Vietnamese)
- Routing: `[locale]` dynamic segment in Next.js App Router
- Currency: `$` USD (en) / `₫` VND (vi)
- Translation tables: `product_translations`, `category_translations`
- Dictionaries: `apps/web/src/i18n/dictionaries/{en,vi}.json`

## User Preferences

- Always use pnpm — never npm or yarn
- Commit with conventional format (`feat:`, `fix:`, `chore:`, etc.)
- Store memory in repo at `.claude/memory/` — not in user home directory
- PostgreSQL 18 and Redis 8 for Docker services

## Key Decisions

- [architecture.md](architecture.md) — Package boundaries, dependency rules
- [patterns.md](patterns.md) — Code patterns and conventions
