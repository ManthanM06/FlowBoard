# rules.md — FlowBoard

Ground rules for this codebase — for you, and for any AI assistant (Claude Code, Copilot, etc.) working in it.

## 1. Libraries — Use vs Avoid

### Use
- **`@dnd-kit/core` + `@dnd-kit/sortable`** for drag-and-drop. Not `react-beautiful-dnd` (unmaintained) or a hand-rolled HTML5 DnD implementation.
- **Prisma** for all DB access. No raw SQL string concatenation, ever — use Prisma's query builder or parameterized `$queryRaw` if a raw query is unavoidable.
- **class-validator + class-transformer** for all NestJS DTO validation. Every controller input gets a DTO — no `any`-typed request bodies.
- **React Query** for all server-state fetching/caching. Don't hand-roll `useEffect` + `fetch` + `useState` for data that belongs in the cache.
- **Zod** (or class-validator equivalent) to validate WebSocket event payloads too — not just REST. A malformed socket event should never crash a handler.
- **bcrypt** (or `argon2`) for password hashing. Never store or log plaintext passwords.
- **Playwright** for E2E, specifically for drag-and-drop flows — Playwright's mouse simulation is more reliable than Cypress for this.

### Avoid
- **Redux/Redux Toolkit** — Zustand + React Query cover this app's needs with far less boilerplate. Don't introduce Redux "because it's standard."
- **GraphQL** — not worth the added complexity for this scope; stick to REST + WebSocket.
- **Moment.js** — deprecated; use `date-fns` or native `Intl`/`Temporal`-style APIs.
- **`any` in TypeScript** — anywhere. If a type is genuinely unknown, use `unknown` and narrow it.
- **Client-authoritative real-time state** — never let a client emit an event that directly updates other clients' state without server validation/persistence in between.
- **Global mutable state outside Zustand/React Query** — no ad-hoc singletons or module-level mutable variables holding app state.

## 2. Error Handling

- **Backend**: every NestJS module uses a global `HttpExceptionFilter`. Domain errors (e.g., "not a board member") throw typed exceptions (`ForbiddenException`, `NotFoundException`, etc.) — never a bare `throw new Error(...)` that leaks a 500 for a client-caused problem.
- **Every async operation that touches the network or DB is wrapped** — no unhandled promise rejections. NestJS interceptors log unexpected errors with a request ID for tracing.
- **Frontend**: React Query's `onError` + a toast/snackbar system for user-facing errors. Never swallow an error silently — at minimum, `console.error` in dev, structured logging in prod.
- **Optimistic UI updates must have a rollback path.** If a card-move API call fails, the UI reverts and shows why (e.g., "You no longer have access to this board").
- **WebSocket handlers wrap all logic in try/catch** and emit an `error` event back to the originating client rather than crashing the connection.
- **Never expose stack traces or internal error messages to the client** in production responses — return a generic message + error code, log details server-side.

## 3. Security Boundaries
- Every board/task/comment mutation checks **workspace membership and role** server-side — never trust a role claim from the frontend.
- Rate-limit auth endpoints (login, signup) — brute-force protection.
- Sanitize/escape any user-generated content (comments, task descriptions) before rendering — no raw HTML injection.
- File/image attachments: validate MIME type and size server-side; never trust the client-reported content-type.

## 4. Boundaries for AI Assistance (Claude Code / Copilot / etc.)

These apply when using an AI coding assistant on this repo:

- **AI may**: scaffold boilerplate (DTOs, CRUD controllers/services, test skeletons, Docker/CI config), write unit tests against existing code, refactor for readability, explain existing code, generate migration files from schema changes.
- **AI should not**: invent new architectural patterns not in `architecture.md` without flagging it first (e.g., don't silently introduce GraphQL, Redux, or a different ORM).
- **AI should not** write or modify authentication/authorization logic (JWT validation, role checks, password hashing) without the change being explicitly reviewed line-by-line — this is the highest-risk surface in the app.
- **AI should not** commit secrets, API keys, or `.env` values — always use environment variable references and confirm `.env` is gitignored.
- **Always re-read the relevant section of `architecture.md` before generating code for a new module**, so folder structure and naming stay consistent — don't let the AI invent its own structure per-feature.
- **Every AI-generated backend endpoint needs a corresponding test** before being considered done — no exceptions, since untested endpoints are the most common source of regressions in a fast-moving AI-assisted repo.
- Treat AI output as a **first draft, not a merge-ready PR** — read every diff before committing, especially around data mutations, transactions, and the reordering/position logic (an off-by-one here silently corrupts board order).
