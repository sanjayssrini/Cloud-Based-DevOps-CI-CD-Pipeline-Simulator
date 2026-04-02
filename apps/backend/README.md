# Backend API

Express + TypeScript + Prisma backend implementing modular, layered architecture for the DevOps simulator.

## Modules

- Auth & Security: JWT access/refresh, bcrypt, RBAC
- Project Upload & Analysis: ZIP ingestion, extraction, type detection, build step generation
- Repository Simulation: commit, branch, checkout, merge
- Pipeline Builder: JSON stage definitions and stage persistence
- CI/CD Execution Engine: deterministic stage/task state machine with retries, timeout, and failure propagation
- Log Engine: structured logs + ANSI-style output over WebSockets
- Deployment Simulation: environment switching and generated deployment URL
- Tutorial Engine: step-locking, context validation, hints
- Validation Engine: rule-based expected state checks
- Gamification & Leaderboard
- Analytics

## API

- `/auth/*`
- `/projects/*`
- `/repository/*`
- `/pipeline/*`
- `/execution/*`
- `/labs/*`
- `/progress/*`
- `/leaderboard`
- `/analytics/*`
- `/deployment/*`
