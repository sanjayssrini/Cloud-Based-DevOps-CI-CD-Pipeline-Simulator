# Cloud-Based DevOps CI/CD Pipeline Simulator

Production-grade, fully simulated DevOps learning platform built with Next.js + Express + Prisma/PostgreSQL.

## Monorepo Apps

- `apps/frontend`: Next.js App Router, TypeScript, Tailwind, Zustand, React Query
- `apps/backend`: Express, TypeScript, Prisma, WebSockets, Zod, JWT, RBAC

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start PostgreSQL in Docker:
   ```bash
   docker run --name devops-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=<YOUR_PASSWORD> -e POSTGRES_DB=devops_sim -p 5432:5432 -d postgres:16-alpine
   ```
3. Configure backend env in `apps/backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/devops_sim?schema=public"
   JWT_ACCESS_SECRET="access-secret"
   JWT_REFRESH_SECRET="refresh-secret"
   PORT=4000
   HOST="0.0.0.0"
   FRONTEND_URL="http://localhost:3000"
   ```
   For LAN access, set `FRONTEND_URL` to your frontend network origin (example: `http://192.168.1.25:3000`).
4. Generate Prisma client and migrate:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. Install Playwright browsers for the webpage tests:
   ```bash
   npx playwright install chromium
   ```
6. Run both apps in one terminal:
   ```bash
   npm run dev
   ```
   Use `npm run dev:backend` or `npm run dev:frontend` only if you want to start one service by itself.

## Webpage Tests

Browser tests live in [test](test) and cover the landing page, auth pages, and authenticated dashboard flow.

Run them with:

```bash
npm install
npm run test:webpage
```

The Playwright config starts the frontend automatically on `http://127.0.0.1:3000`, and the tests mock the API calls they need.

To run the tests in headed mode:

```bash
npm run test:webpage:headed
```

## System Highlights

- Deterministic CI/CD execution engine (state machine + retries + timeout + failure propagation)
- Git-like repository simulation (commit/branch/checkout/merge)
- **🚀 Build Stage Engine** - Realistic, deterministic build simulation with professional logging
- Upload + project analysis engine (Node/Python/Static/Unknown)
- Guided tutorial engine with step-locking and context-aware validation
- Gamification (score, streaks, badges, leaderboard)
- Analytics (success rates and failure patterns)
- Role-aware architecture (Student, Instructor, Admin)

### 🎯 Build Stage Engine

The platform now includes a **Build Stage Engine** (NEW!) featuring:
- ✅ Automatic project type detection (Node.js, Python, Java, Docker, Static)
- ✅ Type-specific build plans with realistic execution
- ✅ Deterministic seeded builds for reproducible demos
- ✅ Configurable failure simulation (0-100%)
- ✅ Professional terminal UI with real-time progress
- ✅ Terminal output with timestamps, colors, and log sources
- ✅ Complete artifact generation

