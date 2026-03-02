# -------------------------------------------------------------------
# Multi-stage Dockerfile for the amazone Next.js application
#
# Uses the Next.js standalone output mode for a minimal production
# image (~150 MB vs ~1 GB for a full node_modules install).
#
# Build args:
#   NODE_VERSION  - Node.js major version (default 22)
#   PNPM_VERSION  - pnpm version matching packageManager field
# -------------------------------------------------------------------

# ── Stage 1: Install dependencies ──────────────────────────────────
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

ARG PNPM_VERSION=10.15.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy only the files needed to resolve and install dependencies.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/products/package.json ./packages/products/package.json
COPY packages/cart/package.json ./packages/cart/package.json
COPY packages/checkout/package.json ./packages/checkout/package.json
COPY packages/orders/package.json ./packages/orders/package.json
COPY packages/users/package.json ./packages/users/package.json
COPY packages/reviews/package.json ./packages/reviews/package.json
COPY packages/shared-ui/package.json ./packages/shared-ui/package.json
COPY packages/shared-utils/package.json ./packages/shared-utils/package.json

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build the application ─────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

ARG PNPM_VERSION=10.15.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/

# Copy all source code.
COPY . .

# NextAuth.js v5 requires AUTH_SECRET at build time for static analysis.
# This dummy value is replaced at runtime by the real secret.
ENV AUTH_SECRET=build-time-placeholder
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm nx build web

# ── Stage 3: Production image ──────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as non-root for security.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone server and static assets.
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
