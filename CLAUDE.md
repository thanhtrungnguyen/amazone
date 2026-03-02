# Amazone E-Commerce Platform

Full-featured e-commerce platform built as an Nx 22 monorepo with Next.js 16, React 19, PostgreSQL 18, Drizzle ORM, Stripe, and shadcn/ui.

> **Claude Code instructions are in [`.claude/CLAUDE.md`](.claude/CLAUDE.md).**
> Architecture rules, coding standards, dependency boundaries, and key commands live there.

## Quick Start

```bash
pnpm install
docker compose up -d          # PostgreSQL 18, Redis 8, Mailhog, Stripe CLI
pnpm drizzle-kit migrate --config packages/db/drizzle.config.ts
pnpm nx dev web               # http://localhost:3000
```

## Project Structure

See [`.claude/CLAUDE.md`](.claude/CLAUDE.md) for the full monorepo layout, or run `pnpm nx graph` to visualize the dependency graph.

## Available Claude Commands

Run `/setup` to scaffold from scratch, `/new-feature` to build end-to-end features, `/audit-security` for security scanning, or type `/` in Claude Code to see all 24 commands.
