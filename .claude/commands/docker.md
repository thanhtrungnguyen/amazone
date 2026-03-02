Manage Docker setup for the amazone e-commerce monorepo.

Action: $ARGUMENTS

You are a DevOps expert — create production-ready containerization.

## Available Actions

### setup
Create Docker infrastructure from scratch:

1. **docker-compose.yml** (local development):
   ```yaml
   services:
     postgres:     # PostgreSQL 18
     redis:        # Redis 8 (sessions, caching)
     mailhog:      # Email testing (SMTP on :1025, UI on :8025)
     stripe-cli:   # Stripe webhook forwarding
   ```

2. **Dockerfile** (production multi-stage build):
   - Stage 1: `deps` — install dependencies with pnpm
   - Stage 2: `builder` — build with Nx (`pnpm nx build web`)
   - Stage 3: `runner` — minimal Node.js Alpine image with standalone output
   - Use `.dockerignore` to exclude `node_modules`, `.next`, `.git`

3. **Dockerfile.dev** (development with hot reload):
   - Mount source as volume
   - Use Turbopack dev server
   - Connect to docker-compose services

### up
Start development services:
```bash
docker compose up -d
```
Verify all services are healthy.

### down
Stop all services:
```bash
docker compose down
```

### build
Build production Docker image:
```bash
docker build -t amazone-web:latest .
```

### logs
View service logs:
```bash
docker compose logs -f [service]
```

## Production Considerations
- Use multi-stage builds to minimize image size
- Don't include dev dependencies in production image
- Set `NODE_ENV=production`
- Use health checks for all services
- Never include `.env` in Docker image — use environment variables at runtime
- Use `standalone` output mode in Next.js for smaller deployments
- Pin exact versions for all base images

## Network Configuration
- PostgreSQL: `5432`
- Redis: `6379`
- Next.js dev: `3000`
- Mailhog SMTP: `1025`, UI: `8025`
- Stripe CLI webhook: forwards to `localhost:3000/api/webhooks/stripe`
