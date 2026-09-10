# memory.md — FlowBoard Progress Log

> Update this as you go — check it off, don't rewrite history. Keep entries short; details belong in commits/PRs, not here.

## Currently working on
- [ ] Phase 2 — Workspaces & Roles (Workspace + WorkspaceMember models, invite flow, Admin/Member role guard, workspace switcher)

## Completed
- [x] Phase 0 — Setup (Monorepo scaffolding, Docker Compose Postgres & Redis, Prisma schema, NestJS API with health check, React + Vite frontend with Studio Ledger design system, GitHub Actions CI skeleton)
- [x] Phase 1 — Auth & Users (User model, signup/login endpoints, JWT access + refresh tokens with DB rotation, bcrypt password hashing, Passport strategy & JwtAuthGuard, Zustand auth store, auto-refresh Axios interceptor, and Studio Ledger auth modal)

## Phase checklist
- [x] Phase 0 — Setup
- [x] Phase 1 — Auth & Users
- [ ] Phase 2 — Workspaces & Roles
- [ ] Phase 3 — Boards & Columns
- [ ] Phase 4 — Task CRUD
- [ ] Phase 5 — Drag & Drop
- [ ] Phase 6 — Real-Time Sync
- [ ] Phase 7 — Comments & Notifications
- [ ] Phase 8 — Search, Filters & Dashboard
- [ ] Phase 9 — Polish, Testing, Deploy

## Open decisions / blockers
_(none)_

## Notes for next session
- Phase 1 verification complete: User signup, login, refresh token rotation, logout, and protected `/api/auth/me` endpoint verified with unit tests and live proxy tests.
- Ready to proceed to Phase 2: Workspaces, workspace membership, invite codes, and role guards (ADMIN vs MEMBER).


