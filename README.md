# FlowBoard 📋⚡

A modern, high-performance team task management and real-time Kanban platform built with **NestJS**, **PostgreSQL**, **Redis**, **React 18**, **TypeScript**, and **Socket.IO**, styled with the **Studio Ledger** design system.

---

## 🌟 Features Across All 9 Phases

1. **Authentication & Identity (Phase 1)**
   - Secure email & password registration with `bcrypt` (10 rounds).
   - Dual-token JWT authentication (15-minute access token + 7-day refresh token stored as hashes in PostgreSQL).
   - Refresh token rotation & automatic Axios 401 interceptor retry.
   - Zustand persistent auth state.

2. **Multi-Workspace Organization & RBAC (Phase 2)**
   - Isolated workspaces with role-based access control (`ADMIN` vs `MEMBER`).
   - Workspace creation and joining via unique invite codes.
   - Team member roster modal with admin permission checks.

3. **Kanban Boards & Columns (Phase 3)**
   - Multiple boards per workspace with persistent board switcher.
   - Auto-seeded default columns: `To Do`, `In Progress`, `Done`.
   - Column renaming, deletion, and addition with real-time UI synchronization.

4. **Task Management (Phase 4)**
   - Rich task creation (title, description, priority, due date, multi-assignee selection).
   - Fractional order indexing (`order: float`) for continuous insertions.
   - Studio Ledger cards featuring 3px left borders keyed to priority:
     - **High**: Crimson `#DC2626`
     - **Medium**: Amber `#D97706`
     - **Low**: Emerald `#059669`
   - Quick inline task composer & comprehensive Task Detail Modal.

5. **Drag & Drop Reordering (Phase 5)**
   - Powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
   - Smooth drag-and-drop within columns and across columns.
   - Fractional order recalculation on `PATCH /api/tasks/:id/move` with automatic column rebalancing fallback.
   - 60fps optimistic UI updates with immediate rollback if server persistence fails.

6. **Real-Time Board Synchronization (Phase 6)**
   - NestJS WebSocket Gateway (`@WebSocketGateway()`) with Socket.IO.
   - Handshake JWT authentication and workspace board room isolation (`board:<boardId>`).
   - Broadcast events on task creation, task move, task edit, task deletion, and column changes.
   - Zero-refresh instant sync across multiple browsers/tabs.

7. **Comments & In-App Notification System (Phase 7)**
   - Rich comment thread in `TaskDetailModal` with author delete permissions.
   - Real-time `comment.added` socket updates.
   - In-app notification bell with unread badge counter in the top bar.
   - Dropdown list with timestamp, commenter, and "Mark all as read".

8. **Search, Filters & Team Delivery Dashboard (Phase 8)**
   - Live search across task titles and descriptions.
   - Multi-parameter filtering: priority, assignee, and due date (Overdue, Today, This Week).
   - Filtered column count indicator (e.g. `2/5`).
   - **Team Dashboard View**:
     - 4 delivery KPI cards: Total Tasks, Completed, High Priority, Overdue.
     - Progress bar tracking board completion rate.
     - Priority distribution bars.
     - Team member workload breakdown table.

9. **Polish, Responsiveness & Testing (Phase 9)**
   - Fully responsive layout with mobile touch snapping (`snap-x snap-mandatory`).
   - Click-outside modal dismissal without backdrop blur.
   - Comprehensive test suite (55 passing tests across 8 suites, including E2E integration test).

---

## 🏗️ Monorepo Structure

```
.
├── apps/
│   ├── api/                    # NestJS REST & WebSocket API
│   │   ├── prisma/             # Prisma schema & PostgreSQL migrations
│   │   └── src/
│   │       ├── auth/           # JWT, Bcrypt, Passport strategy
│   │       ├── workspaces/     # Workspace CRUD, invite codes, RBAC
│   │       ├── boards/         # Boards & Columns CRUD
│   │       ├── tasks/          # Task CRUD & fractional order moving
│   │       ├── realtime/       # Socket.IO gateway & board rooms
│   │       ├── comments/       # Task comments API
│   │       ├── notifications/  # User notifications API
│   │       └── app.e2e.spec.ts # Full integration test suite
│   └── web/                    # React 18 + Vite + Tailwind CSS
│       └── src/
│           ├── features/
│           │   ├── auth/       # Login/Register modal, authStore
│           │   ├── workspaces/ # Switcher, Create/Join modals
│           │   ├── boards/     # Kanban board, columns, DND, filter toolbar, dashboard
│           │   ├── tasks/      # TaskCard, TaskDetailModal, CreateTaskModal
│           │   ├── comments/   # Comments API client
│           │   └── notifications/ # NotificationBell dropdown
│           └── shared/         # Axios client, Socket.IO client, design tokens
├── packages/
│   └── shared-types/           # Shared TypeScript interfaces, DTOs & enums
├── docker-compose.yml          # PostgreSQL 16 & Redis 7
└── memory.md                   # Project milestone progress log
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- npm 10+

### Step 1: Start PostgreSQL and Redis
```bash
docker compose up -d
```
Verify containers are healthy:
```bash
docker compose ps
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Database Schema
```bash
npm run prisma:push --workspace=apps/api
```

### Step 4: Build Shared Types
```bash
npm run build --workspace=packages/shared-types
```

### Step 5: Start the Development Servers
In two separate terminals:

**Terminal 1 (Backend API on http://localhost:3001):**
```bash
npm run dev:api
```

**Terminal 2 (Frontend on http://localhost:5173):**
```bash
npm run dev:web
```

Visit **http://localhost:5173** in your browser.

---

## 🧪 Running Tests

### Run All Backend & Integration Tests:
```bash
npm run test --workspace=apps/api
```
*(Runs 55 tests across 8 suites: auth, workspaces, boards, tasks, realtime, comments, notifications, and E2E)*

### Build All Workspaces:
```bash
npm run build
```

### Run Linter:
```bash
npm run lint
```
