# PRD.md — FlowBoard (Team Kanban Board App)

> Working name: **FlowBoard**. Rename freely — nothing downstream depends on the name.

## 1. What We're Building

FlowBoard is a collaborative task and project management tool, similar in spirit to Trello, built around **teams, boards, and real-time collaboration**. Users organize work into boards with columns (To Do / In Progress / Done, customizable), move task cards between columns via drag-and-drop, and see teammates' changes reflected live without refreshing.

This is a portfolio-grade full-stack project meant to demonstrate:
- Complex, stateful frontend UI (drag-and-drop, optimistic updates)
- Real-time systems (WebSockets, pub/sub at scale)
- Solid data modeling and auth/authorization
- Production practices (Docker, CI/CD, testing)

It is **not** meant to compete with Trello/Jira feature-for-feature. Scope is deliberately bounded (see Phase plan in `phases.md`) so it ships as a complete, demoable product rather than a permanently half-built clone.

## 2. Problem Statement

Small teams and student groups need a lightweight way to track shared work — who's doing what, what's blocked, what's done — without the overhead of enterprise tools like Jira. FlowBoard targets that gap: fast to set up, visual, real-time, and simple enough to explain and demo in an interview.

## 3. Target Users

| User | Needs |
|---|---|
| **Team admin** (project owner / lead) | Create workspace, invite members, manage roles, create/delete boards, see overall progress |
| **Team member** | Join a project, see assigned tasks, move cards, comment, get notified when something changes |
| **Recruiter / interviewer (secondary "user")** | Understand the system in a 5-minute walkthrough; see real-time sync, clean architecture, and testing in a live demo |

FlowBoard is designed for **small teams (2–15 people)** — student project groups, small startups, or personal multi-project tracking — not enterprise-scale orgs.

## 4. Core Features (MVP scope)

### 4.1 User & Workspace Management
- Sign up / log in (email + password, JWT-based)
- Create a "workspace" (team) or join one via invite link/code
- Roles: **Admin** (full control) vs **Member** (limited: can't delete boards or remove members)

### 4.2 Boards & Columns
- A workspace can have multiple boards (projects)
- Each board has columns (default: To Do / In Progress / Done); columns can be renamed, reordered, added, or removed by admins
- Drag-and-drop cards between columns and reorder within a column

### 4.3 Task Cards
- Title, description, assignee(s), due date, priority (Low/Med/High), labels/tags
- Comments thread per card
- Optional file/image attachment
- Activity log per card (who changed what, when)

### 4.4 Real-Time Sync
- Moving/creating/editing a card broadcasts to all connected board members instantly (WebSocket)
- Presence indicator (optional stretch): who else is currently viewing the board

### 4.5 Notifications
- In-app notification when: assigned to a task, mentioned in a comment, due date approaching
- Notification bell with unread badge; mark-as-read
- Email notification is a **stretch goal**, not MVP

### 4.6 Dashboard & Analytics
- Per-board overview: task counts by status/priority
- Simple "tasks completed this week" metric
- Stretch: burndown chart, average cycle time per task

### 4.7 Search & Filters
- Filter board by assignee, label, priority, due date range
- Basic text search across task titles/descriptions

## 5. Out of Scope (explicitly, for MVP)
- Multi-workspace billing / payments
- Native mobile apps (responsive web only)
- Third-party integrations (Slack, GitHub linking, etc.)
- Advanced permission granularity beyond Admin/Member
- Offline support / conflict-free sync (CRDTs) — last-write-wins is acceptable for v1

## 6. Success Criteria
- A stranger can sign up, create a workspace, invite a teammate, and move a task card within 2 minutes, with zero documentation.
- Two browser sessions (simulating two users) show real-time updates within ~1 second of a card move.
- Core flows (auth, board CRUD, card CRUD, drag-and-drop, comments, notifications) are covered by automated tests.
- The whole thing runs via `docker compose up` with no manual setup steps.
