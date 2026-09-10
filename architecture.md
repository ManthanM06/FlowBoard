# architecture.md — FlowBoard

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript, Vite | Fast dev loop, type safety for complex card/board state |
| Drag & Drop | `@dnd-kit/core` | Actively maintained, more accessible and flexible than `react-beautiful-dnd` (which is in maintenance mode) |
| State management | React Query (server state) + Zustand (local/UI state) | Avoids Redux boilerplate; React Query handles caching/refetch for REST data, Zustand handles ephemeral UI state (modals, drag state) |
| UI library | MUI or Chakra (pick one, don't mix) | Accessible primitives; customize via theme (see `design.md`) — not used out of the box |
| Backend | Node.js + NestJS | Structured, opinionated, has first-class WebSocket gateway support — good fit for a project that needs to demonstrate architecture |
| API style | REST (+ WebSocket channel for live events) | GraphQL adds real complexity for marginal benefit here; REST keeps the surface easy to explain in an interview |
| Real-time | Socket.IO via NestJS Gateway | Mature, handles reconnection/fallback; add Redis adapter only when horizontally scaling |
| Database | PostgreSQL | Relational data (users, workspaces, boards, tasks, comments) with real foreign keys and constraints |
| ORM | Prisma | Type-safe queries, easy migrations, pairs well with TypeScript on both ends |
| Cache / pub-sub | Redis | Socket.IO adapter for multi-instance broadcast; also used for rate-limiting and session/token blacklist |
| Auth | JWT (access + refresh token pair), Passport.js strategy | Stateless auth that plays well with WebSocket auth handshake |
| Containerization | Docker + Docker Compose | One-command local spin-up: frontend, backend, Postgres, Redis |
| CI/CD | GitHub Actions | Lint + test + build on PR; optional deploy step |
| Testing | Jest (unit/integration), Playwright (E2E incl. drag-and-drop) | Playwright handles drag-and-drop simulation better than Cypress currently |

## 2. High-Level Architecture

```
                     ┌─────────────────────┐
                     │   React Frontend    │
                     │  (Vite, TS, dnd-kit) │
                     └─────────┬───────────┘
                     REST (HTTPS)   WebSocket
                               │           │
                     ┌─────────▼───────────▼───────┐
                     │        NestJS API           │
                     │  Controllers │ Gateways      │
                     │  Services    │ Guards (auth) │
                     └───┬─────────────────┬────────┘
                         │                 │
                 ┌───────▼──────┐   ┌──────▼───────┐
                 │  PostgreSQL   │   │    Redis     │
                 │  (Prisma)     │   │ (pub/sub,    │
                 │               │   │  Socket.IO   │
                 │               │   │  adapter)    │
                 └───────────────┘   └──────────────┘
```

### Request flow (typical: moving a card)
1. User drags a card in the UI → `dnd-kit` fires `onDragEnd`.
2. Frontend **optimistically** updates local state immediately (card appears moved).
3. Frontend calls `PATCH /boards/:boardId/tasks/:taskId/move` with new column/position.
4. NestJS `TasksController` → `TasksService` validates (auth guard + membership check) → updates row in a DB transaction (position reordering).
5. On success, `TasksService` emits a `task.moved` event to the board's Socket.IO room.
6. All other connected clients on that board receive `task.moved` and update their local state.
7. If the API call fails, the frontend rolls back the optimistic update and shows a toast.

## 3. Folder Structure

```
flowboard/
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── apps/
│   ├── web/                        # React frontend
│   │   ├── src/
│   │   │   ├── app/                # app shell, routing, providers
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── workspaces/
│   │   │   │   ├── boards/
│   │   │   │   │   ├── components/     # Board, Column, Card, DragLayer
│   │   │   │   │   ├── hooks/          # useBoard, useDragAndDrop
│   │   │   │   │   └── api.ts
│   │   │   │   ├── tasks/              # TaskCard detail modal, comments
│   │   │   │   ├── notifications/
│   │   │   │   └── dashboard/          # analytics/charts
│   │   │   ├── shared/
│   │   │   │   ├── components/         # buttons, inputs, layout primitives
│   │   │   │   ├── theme/              # design tokens, from design.md
│   │   │   │   ├── lib/                # axios/query client, socket client
│   │   │   │   └── types/
│   │   │   └── main.tsx
│   │   ├── tests/
│   │   │   └── e2e/                    # Playwright specs
│   │   └── package.json
│   │
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── auth/                   # controller, service, guards, strategies
│       │   ├── workspaces/
│       │   ├── boards/
│       │   ├── tasks/                  # includes reordering/position logic
│       │   ├── comments/
│       │   ├── notifications/
│       │   ├── realtime/               # Socket.IO gateway, room management
│       │   ├── prisma/                 # PrismaService, schema.prisma
│       │   ├── common/                 # guards, interceptors, filters, DTOs
│       │   └── main.ts
│       ├── test/                       # Jest unit + integration
│       └── package.json
│
├── packages/
│   └── shared-types/                # DTOs/interfaces shared between web & api
│
└── infra/
    ├── docker/
    │   ├── Dockerfile.web
    │   └── Dockerfile.api
    └── redis/ , postgres/           # init scripts if needed
```

## 4. Core Data Model (simplified)

```
User            (id, email, passwordHash, name, avatarUrl)
Workspace       (id, name, ownerId)
WorkspaceMember (userId, workspaceId, role: ADMIN | MEMBER)
Board           (id, workspaceId, name)
Column          (id, boardId, name, order)
Task            (id, columnId, title, description, priority, dueDate, order)
TaskAssignee    (taskId, userId)         -- many-to-many
Comment         (id, taskId, userId, body, createdAt)
Notification    (id, userId, type, payload, readAt)
```

- `order` fields (on Column and Task) are floats or fractional-indexed integers to support cheap reordering without rewriting every row on every move.
- All cross-entity writes (e.g., moving a task, deleting a board) go through a DB transaction.

## 5. Real-Time Design
- One Socket.IO **room per board** (`board:<boardId>`). Clients join on board open, leave on close.
- Server is the source of truth: client emits nothing directly to other clients — every event goes through the API (validated, persisted) and is then broadcast from the server. No client-to-client trust.
- Redis adapter (`@socket.io/redis-adapter`) is added only once running more than one API instance — not needed for a single-instance dev/demo setup.
