# memory.md — FlowBoard Progress Log

> Update this as you go — check it off, don't rewrite history. Keep entries short; details belong in commits/PRs, not here.

## Currently working on
- [ ] Phase 4 — Task CRUD (Task model + CRUD endpoints: title, description, assignee, due date, priority, creation modal, task detail view)

## Completed
- [x] Phase 0 — Setup (Monorepo scaffolding, Docker Compose Postgres & Redis, Prisma schema, NestJS API with health check, React + Vite frontend with Studio Ledger design system, GitHub Actions CI skeleton)
- [x] Phase 1 — Auth & Users (User model, signup/login endpoints, JWT access + refresh tokens with DB rotation, bcrypt password hashing, Passport strategy & JwtAuthGuard, Zustand auth store, auto-refresh Axios interceptor, and Studio Ledger auth modal)
- [x] Phase 2 — Workspaces & Roles (Workspace + WorkspaceMember models, invite code generation & join flow, WorkspaceRolesGuard enforcing Admin vs Member permissions, workspace switcher dropdown, create/join modals, and team members roster)
- [x] Phase 3 — Boards & Columns (Board + Column CRUD with Admin-only creation/deletion/reordering, default column seeding To Do/In Progress/Done, BoardHeader switcher, KanbanColumn with rename/delete, horizontal scrolling Kanban board view, and localStorage board persistence)

## Phase checklist
- [x] Phase 0 — Setup
- [x] Phase 1 — Auth & Users
- [x] Phase 2 — Workspaces & Roles
- [x] Phase 3 — Boards & Columns
- [ ] Phase 4 — Task CRUD
- [ ] Phase 5 — Drag & Drop
- [ ] Phase 6 — Real-Time Sync
- [ ] Phase 7 — Comments & Notifications
- [ ] Phase 8 — Search, Filters & Dashboard
- [ ] Phase 9 — Polish, Testing, Deploy

## Open decisions / blockers
_(none)_

## Notes for next session
- Phase 3 verification complete: Board creation with auto-seeded default columns, column rename & delete, Admin vs Member permissions, and full Studio Ledger horizontal Kanban board view verified.
- Ready to proceed to Phase 4: Task model & CRUD (title, description, assignee, priority, dueDate, order), task creation modal, and card components.



