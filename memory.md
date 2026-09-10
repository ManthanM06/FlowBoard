# memory.md — FlowBoard Progress Log

> Update this as you go — check it off, don't rewrite history. Keep entries short; details belong in commits/PRs, not here.

## Currently working on
- [ ] Phase 9 — Polish, Testing, Deploy (Mobile responsive folding, keyboard navigation, Docker health validation, Playwright/E2E test suite, final production readiness)

## Completed
- [x] Phase 0 — Setup (Monorepo scaffolding, Docker Compose Postgres & Redis, Prisma schema, NestJS API with health check, React + Vite frontend with Studio Ledger design system, GitHub Actions CI skeleton)
- [x] Phase 1 — Auth & Users (User model, signup/login endpoints, JWT access + refresh tokens with DB rotation, bcrypt password hashing, Passport strategy & JwtAuthGuard, Zustand auth store, auto-refresh Axios interceptor, and Studio Ledger auth modal)
- [x] Phase 2 — Workspaces & Roles (Workspace + WorkspaceMember models, invite code generation & join flow, WorkspaceRolesGuard enforcing Admin vs Member permissions, workspace switcher dropdown, create/join modals, and team members roster)
- [x] Phase 3 — Boards & Columns (Board + Column CRUD with Admin-only creation/deletion/reordering, default column seeding To Do/In Progress/Done, BoardHeader switcher, KanbanColumn with rename/delete, horizontal scrolling Kanban board view, and localStorage board persistence)
- [x] Phase 4 — Task CRUD (Task model + CRUD endpoints, fractional order indexing, TaskCard with Studio Ledger 3px priority border, quick inline composer, CreateTaskModal, and TaskDetailModal)
- [x] Phase 5 — Drag & Drop (@dnd-kit cross-column and within-column reordering, PATCH /tasks/:id/move with fractional-order calculation and rebalancing fallback, optimistic UI updates with automatic rollback on error, and DragOverlay preview)
- [x] Phase 6 — Real-Time Sync (NestJS Socket.IO gateway with JWT auth handshake, room isolation board:<id>, broadcast events on task/column mutations, useBoardSocket auto-syncing client boardStore)
- [x] Phase 7 — Comments & Notifications (Comments CRUD + Socket.IO real-time thread in TaskDetailModal, in-app notification system with bell badge, click-outside dismissal, mark as read / mark all read)
- [x] Phase 8 — Search, Filters & Dashboard (Live title/description task search, priority/assignee/due-date filter toolbar, filtered column badge counters, Team Dashboard with delivery progress bar, 4 KPI cards, priority distribution and member workload breakdown)

## Phase checklist
- [x] Phase 0 — Setup
- [x] Phase 1 — Auth & Users
- [x] Phase 2 — Workspaces & Roles
- [x] Phase 3 — Boards & Columns
- [x] Phase 4 — Task CRUD
- [x] Phase 5 — Drag & Drop
- [x] Phase 6 — Real-Time Sync
- [x] Phase 7 — Comments & Notifications
- [x] Phase 8 — Search, Filters & Dashboard
- [ ] Phase 9 — Polish, Testing, Deploy

## Open decisions / blockers
_(none)_

## Notes for next session
- Phase 4 verification complete: Task creation, priority badges, due dates, assignee joins, task detail/edit modal, deletion, and eager loading of column tasks tested and validated.
- Ready to proceed to Phase 5: @dnd-kit/core + @dnd-kit/sortable cross-column and within-column drag and drop, fractional order recalculation, and optimistic UI rollback.



