# phases.md — FlowBoard

Eight phases, roughly one week each — matches the difficulty/timeline noted for this class of project. Each phase ends with something runnable/demoable, not just code in progress.

## Phase 0 — Setup (pre-Week 1)
- Repo scaffolding: monorepo structure (`apps/web`, `apps/api`, `packages/shared-types`)
- Docker Compose with Postgres + Redis + placeholder API/web containers
- Prisma initialized, connected to Postgres
- GitHub Actions skeleton: lint + build on push
- **Done when**: `docker compose up` boots empty frontend + empty API that can hit the DB.

## Phase 1 — Auth & Users (Week 1)
- User model, signup/login endpoints, JWT access + refresh token flow
- Password hashing (bcrypt), auth guards
- Frontend: login/signup pages, auth context, protected routes
- **Done when**: a user can sign up, log in, refresh a token, and hit a protected `/me` endpoint.

## Phase 2 — Workspaces & Roles (Week 2)
- Workspace + WorkspaceMember models, invite flow (invite code or link)
- Role checks (Admin/Member) as a reusable guard
- Frontend: create workspace, join workspace, workspace switcher
- **Done when**: two test users can be in the same workspace with different roles, and role-gated actions are rejected server-side for Members.

## Phase 3 — Boards & Columns (Week 3)
- Board + Column CRUD (admin-only create/delete)
- Frontend: board list, board view with static columns (no drag yet)
- **Done when**: a board with columns renders and persists across reloads.

## Phase 4 — Task CRUD (Week 3–4)
- Task model + CRUD endpoints (title, description, assignee, due date, priority)
- Frontend: task creation modal, task detail view
- **Done when**: tasks can be created, edited, deleted, and appear in the correct column.

## Phase 5 — Drag & Drop (Week 4)
- `@dnd-kit` integration for cross-column and within-column reordering
- Backend: `PATCH /tasks/:id/move` with fractional-order recalculation inside a DB transaction
- Optimistic UI update + rollback-on-failure
- **Done when**: dragging a card updates the DB and survives a page refresh with the correct order.

## Phase 6 — Real-Time Sync (Week 5)
- Socket.IO gateway; board-scoped rooms; auth on socket handshake
- Emit/broadcast on task create/update/move/delete
- Frontend: socket client subscribes to the open board, merges incoming events into local state
- **Done when**: two browser windows on the same board reflect each other's changes within ~1 second, no refresh needed.

## Phase 7 — Comments & Notifications (Week 5–6)
- Comment model + endpoints; comment thread UI on task detail
- Notification model; triggers on assignment + comment mention
- Notification bell UI with unread badge, mark-as-read
- **Done when**: assigning a teammate to a task produces a notification they see without refreshing.

## Phase 8 — Search, Filters & Dashboard (Week 6–7)
- Filter board by assignee/label/priority/due date
- Basic text search across task titles
- Dashboard: task counts by status, tasks completed this week
- **Done when**: filters correctly narrow the visible board, and dashboard numbers match actual DB state.

## Phase 9 — Polish, Testing, Deploy (Week 7–8)
- Responsive layout (columns collapse to vertical list on mobile)
- Jest unit/integration tests for core services; Playwright E2E for auth flow + drag-and-drop
- Finalize CI (lint + test + build on every PR)
- Deploy (or fully document local Docker Compose deploy if hosting isn't in scope)
- **Done when**: `docker compose up` is the only setup step needed for a fresh reviewer, and CI is green.

## Stretch goals (only after Phase 9 is solid)
- Email notifications
- Presence indicators ("who's viewing this board")
- Burndown chart / cycle-time analytics
- Redis-backed Socket.IO adapter + multi-instance load test
