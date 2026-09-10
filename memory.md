# memory.md — FlowBoard Progress Log

> Update this as you go — check it off, don't rewrite history. Keep entries short; details belong in commits/PRs, not here.

## Currently working on
- [ ] Phase 3 — Boards & Columns (Board + Column CRUD, Admin-only create/delete, board list, board view with static columns)

## Completed
- [x] Phase 0 — Setup (Monorepo scaffolding, Docker Compose Postgres & Redis, Prisma schema, NestJS API with health check, React + Vite frontend with Studio Ledger design system, GitHub Actions CI skeleton)
- [x] Phase 1 — Auth & Users (User model, signup/login endpoints, JWT access + refresh tokens with DB rotation, bcrypt password hashing, Passport strategy & JwtAuthGuard, Zustand auth store, auto-refresh Axios interceptor, and Studio Ledger auth modal)
- [x] Phase 2 — Workspaces & Roles (Workspace + WorkspaceMember models, invite code generation & join flow, WorkspaceRolesGuard enforcing Admin vs Member permissions, workspace switcher dropdown, create/join modals, and team members roster)

## Phase checklist
- [x] Phase 0 — Setup
- [x] Phase 1 — Auth & Users
- [x] Phase 2 — Workspaces & Roles
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
- Phase 2 verification complete: Multi-tenant workspace separation, invite code generation and join flow, Admin vs Member role guards, and workspace switcher tested and validated.
- Ready to proceed to Phase 3: Board and Column CRUD, board switcher, and static column layout.



