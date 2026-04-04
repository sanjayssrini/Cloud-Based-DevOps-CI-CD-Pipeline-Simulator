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
2. Configure backend env in `apps/backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/devops_sim?schema=public"
   JWT_ACCESS_SECRET="access-secret"
   JWT_REFRESH_SECRET="refresh-secret"
   PORT=4000
   FRONTEND_URL="http://localhost:3000"
   ```
3. Generate Prisma client and migrate:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
4. Run backend:
   ```bash
   npm run dev:backend
   ```
5. Run frontend:
   ```bash
   npm run dev:frontend
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

**Get Started:**
- 📖 [BUILD_ENGINE_QUICKSTART.md](BUILD_ENGINE_QUICKSTART.md) - User guide
- 📚 [BUILD_ENGINE_GUIDE.md](BUILD_ENGINE_GUIDE.md) - Technical reference
- 🔧 [BUILD_ENGINE_DELIVERY.md](BUILD_ENGINE_DELIVERY.md) - Feature overview

See app-level READMEs for details.
