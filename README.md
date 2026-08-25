# 🚀 DevPulse — Production Developer Collaboration, GitHub Telemetry & API Monitoring Platform

> A full-stack, enterprise-ready real-time developer collaboration, GitHub activity tracking, and automated API health monitoring system.

---

## 📋 Table of Contents
- [1. Executive Summary \& Overview](#1-executive-summary--overview)
- [2. Core Features \& System Capabilities](#2-core-features--system-capabilities)
  - [🔐 Authentication, Authorization \& RBAC](#-authentication-authorization--rbac)
  - [📋 Real-Time Drag-and-Drop Kanban Board](#-real-time-drag-and-drop-kanban-board)
  - [🐙 GitHub Integration \& Automated Webhooks](#-github-integration--automated-webhooks)
  - [⚡ API Health \& Uptime Monitoring System](#-api-health--uptime-monitoring-system)
  - [🔔 Live Notifications \& Mention Engine](#-live-notifications--mention-engine)
  - [📊 Engineering Analytics \& Telemetry](#-engineering-analytics--telemetry)
- [3. Complete Technology Stack](#3-complete-technology-stack)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Database \& Caching Layer](#database--caching-layer)
  - [DevOps \& Quality Assurance](#devops--quality-assurance)
- [4. High-Level Architecture \& Data Flow Diagrams](#4-high-level-architecture--data-flow-diagrams)
- [5. Database Architecture \& Entity Relationships (MySQL 8)](#5-database-architecture--entity-relationships-mysql-8)
  - [Relational Tables Overview (21 Tables)](#relational-tables-overview-21-tables)
- [6. Deep Dive: How Key Features Work](#6-deep-dive-how-key-features-work)
  - [Dual-Token JWT Security with HTTP-Only Cookies](#dual-token-jwt-security-with-http-only-cookies)
  - [GitHub Webhook Verification \& Asynchronous Processing Pipeline](#github-webhook-verification--asynchronous-processing-pipeline)
  - [BullMQ Repeatable API Health Check Engine](#bullmq-repeatable-api-health-check-engine)
  - [Socket.IO Real-Time Synchronization](#socketio-real-time-synchronization)
- [7. Complete REST API Endpoint Directory](#7-complete-rest-api-endpoint-directory)
- [8. Installation, Local Setup \& Environment Configuration](#8-installation-local-setup--environment-configuration)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Setup](#step-by-step-setup)
- [9. Testing Suite](#9-testing-suite)
- [10. Project Directory Structure](#10-project-directory-structure)

---

## 1. Executive Summary & Overview

**DevPulse** is a production-quality engineering workspace platform engineered for modern software development teams. It unifies project task tracking, GitHub development activity, API endpoint health checks, real-time collaboration, and telemetry metrics into a single high-performance dashboard.

### Why DevPulse?
Engineering teams frequently juggle disparate tools: Jira for task tracking, Datadog/UptimeRobot for API monitoring, GitHub for commit/PR tracking, and Slack for notifications. DevPulse aggregates these critical tools into a single context-aware developer hub, eliminating context-switching while delivering instant real-time synchronization across team members.

---

## 2. Core Features & System Capabilities

### 🔐 Authentication, Authorization & RBAC
- **Dual JWT Token Mechanism**: 15-minute access tokens delivered via HTTP-only, secure, `SameSite` cookies, coupled with 7-day refresh tokens supporting token rotation and session revocation.
- **Argon2id Hashing**: Password storage secured with memory-hard Argon2id hashing algorithms.
- **GitHub OAuth 2.0**: Native "Continue with GitHub" flow allowing instant account creation and token scoping.
- **Multi-Tenant RBAC**: Granular role hierarchy (**OWNER**, **ADMIN**, **DEVELOPER**, **VIEWER**) enforced at both workspace and project boundaries.

### 📋 Real-Time Drag-and-Drop Kanban Board
- **Interactive Board**: Built with `@dnd-kit` supporting smooth drag-and-drop state updates across columns (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`).
- **Rich Task Metadata**: Assignees, priority indicators (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due date trackers, and custom labels.
- **Socket.IO Live Sync**: Dragging a card instantly reflects on the screens of all connected team members in the project room.

### 🐙 GitHub Integration & Automated Webhooks
- **Repository Connectivity**: Link GitHub repos directly to DevPulse projects.
- **Secure Webhooks**: Express raw-body parsing for HMAC-SHA256 signature validation (`X-Hub-Signature-256`).
- **Delivery Idempotency**: Tracks `X-GitHub-Delivery` IDs in MySQL to prevent duplicate event execution.
- **Commit-to-Issue Auto-Linking**: Webhook workers parse commit messages (e.g. `fixes #142` or `ref #142`) and automatically link commits to DevPulse Issue `#142`.

### ⚡ API Health & Uptime Monitoring System
- **Automated Health Checks**: BullMQ repeatable background jobs execute HTTP requests (`GET`, `POST`, `HEAD`) against configured target URLs at 1m, 5m, 15m, or 1h intervals.
- **Incident Lifecycle**: Automatically opens an `Incident` upon health check failure and resolves it upon service recovery.
- **Real-Time Downtime Alerts**: Emits Socket.IO alerts and toasts to connected users when a monitor state transitions (`UP` ↔ `DOWN`).

### 🔔 Live Notifications & Mention Engine
- **`@username` Mentions**: Rich TipTap comment editor parses user mentions and generates instant inbox notifications.
- **Socket.IO Push**: Emits `notification:created` events directly to user-specific WebSocket rooms (`user:{userId}`).

### 📊 Engineering Analytics & Telemetry
- **Visual Analytics**: Interactive **Recharts** visualizations detailing issue status breakdown, commit velocity over time, and API response latency trends (ms).

---

## 3. Complete Technology Stack

### Frontend Architecture
- **Framework**: Next.js 14 (App Router, Pure JavaScript CommonJS/ES Modules — NO TypeScript).
- **Styling**: Modern Vanilla CSS + Tailwind CSS (Custom Dark Palette, Glassmorphism, smooth animations).
- **State Management**: TanStack Query v5 (server state caching) + Zustand (client UI state).
- **Interactive UI**: `@dnd-kit` (Kanban drag-and-drop), `@tiptap/react` (rich comment editor with mentions), `lucide-react` (icons), `react-hot-toast` (alerts).
- **Real-Time Client**: `socket.io-client` with auto-reconnection and exponential backoff logic.
- **Data Visualization**: `recharts` (Bar charts, Area charts, Responsive containers).

### Backend Architecture
- **Runtime Environment**: Node.js & Express.js (Modular layered architecture: Routes → Middleware → Controllers → Services → Repositories).
- **WebSockets**: `socket.io` server with JWT authentication handshakes and dynamic room join/leave listeners (`workspace:{id}`, `project:{id}`, `user:{id}`).
- **Asynchronous Task Queue**: BullMQ queues (`githubEventQueue`, `monitorQueue`, `notificationQueue`) backed by Redis.
- **Validation & Security**: `zod` schema validation middleware, `helmet` HTTP header protections, `express-rate-limit` with Redis store.
- **Logging**: Winston logger configured with environment-specific transports and structured JSON formatting.

### Database & Caching Layer
- **Primary Relational Database**: MySQL 8.0 driven by standard `mysql2/promise` connection pools executing parameterized raw SQL queries.
- **Database Initialization**: Native DDL SQL script (`backend/src/config/schema.sql`) executed on startup to auto-create all 21 tables, foreign keys, and indexes.
- **Cache & Message Broker**: Redis 7 (used for BullMQ job state, rate limiting, and active WebSocket socket tracking).

### DevOps & Quality Assurance
- **Containerization**: Docker Compose (`mysql:8.0` & `redis:7-alpine`).
- **CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`) performing multi-job linting, building, and automated tests.
- **Testing**: Jest + Supertest (Backend unit & integration tests), Playwright (Frontend End-to-End user flow tests).

---

## 4. High-Level Architecture & Data Flow Diagrams

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Next.js 14 UI)                          │
│   App Router Pages | Tailwind CSS | TanStack Query | Socket.IO Client      │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ REST API (Cookie Auth) / WebSockets
┌─────────────────────────────────────▼─────────────────────────────────────┐
│                           DEVPUULSE API SERVER                            │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ Express Controllers  │  │ Socket.IO Server    │  │ Webhook Handler  │  │
│  └──────────┬───────────┘  └──────────┬──────────┘  └────────┬─────────┘  │
│             │                         │                      │            │
│  ┌──────────▼───────────┐             │             ┌────────▼─────────┐  │
│  │ Business Services    │             │             │ BullMQ Queues    │  │
│  └──────────┬───────────┘             │             └────────┬─────────┘  │
│             │                         │                      │            │
│  ┌──────────▼───────────┐             │             ┌────────▼─────────┐  │
│  │ Raw MySQL Repos      │             │             │ BullMQ Workers   │  │
│  └──────────┬───────────┘             │             └────────┬─────────┘  │
└─────────────┼─────────────────────────┼──────────────────────┼────────────┘
              │                         │                      │
┌─────────────▼──────────┐   ┌──────────▼──────────┐  ┌────────▼────────────┐
│    MySQL 8 Database    │   │  Redis 7 Cache/MQ   │  │   GitHub REST API   │
│ (21 Relational Tables) │   │ (BullMQ & Sockets)  │  │  (OAuth & Webhooks) │
└────────────────────────┘   └─────────────────────┘  └─────────────────────┘
```

---

## 5. Database Architecture & Entity Relationships (MySQL 8)

DevPulse uses a clean, highly normalized 21-table MySQL schema (`backend/src/config/schema.sql`).

```
                    ┌──────────────┐
                    │    users     │
                    └──────┬───────┘
                           │ 1:N
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│ refresh_tokens │ │   workspaces   │ │ github_accounts│
└────────────────┘ └───────┬────────┘ └────────────────┘
                           │ 1:N
                   ┌───────▼────────┐
                   │    projects    │
                   └───────┬────────┘
                           │ 1:N
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│     issues     │ │    monitors    │ │  github_repos  │
└───────┬────────┘ └───────┬────────┘ └────────────────┘
        │ 1:N              │ 1:N
┌───────▼────────┐ ┌───────▼────────┐
│    comments    │ │ monitor_checks │
└────────────────┘ └────────────────┘
```

### Relational Tables Overview (21 Tables)

| Table Name | Description | Key Column Specs |
|---|---|---|
| `users` | User profile registry | `id (UUID)`, `email (UNIQUE)`, `username (UNIQUE)`, `password_hash` |
| `refresh_tokens` | JWT refresh tokens | `token (UNIQUE)`, `user_id (FK)`, `expires_at`, `revoked (TINYINT)` |
| `workspaces` | Multi-tenant organization containers | `id (UUID)`, `name`, `slug (UNIQUE)`, `owner_id (FK)` |
| `workspace_members` | Member roles per workspace | `workspace_id (FK)`, `user_id (FK)`, `role (OWNER/ADMIN/DEV/VIEWER)` |
| `projects` | Projects inside workspaces | `id (UUID)`, `name`, `project_key`, `workspace_id (FK)` |
| `project_members` | Member roles per project | `project_id (FK)`, `user_id (FK)`, `role (ADMIN/DEV/VIEWER)` |
| `issues` | Tasks / Kanban issues | `id (UUID)`, `number (INT)`, `status (ENUM)`, `priority (ENUM)` |
| `issue_labels` | Tags attached to issues | `issue_id (FK)`, `label (VARCHAR)` |
| `comments` | Issue comments & discussions | `id (UUID)`, `body (LONGTEXT)`, `issue_id (FK)`, `author_id (FK)` |
| `notifications` | System & mention alerts | `user_id (FK)`, `title`, `message`, `metadata (JSON)`, `is_read` |
| `activities` | Timeline activity stream | `project_id (FK)`, `workspace_id (FK)`, `user_id (FK)`, `payload (JSON)` |
| `audit_logs` | Security audit trail | `user_id (FK)`, `action`, `resource`, `ip_address`, `metadata (JSON)` |
| `github_accounts` | Connected GitHub user OAuth | `user_id (FK, UNIQUE)`, `github_id (UNIQUE)`, `access_token` |
| `github_repositories` | Connected GitHub repositories | `github_id (UNIQUE)`, `full_name (UNIQUE)`, `project_id (FK)` |
| `github_commits` | Pushed commits synced | `sha (UNIQUE)`, `repository_id (FK)`, `issue_id (FK)` |
| `github_pull_requests` | Sync pull requests | `repository_id (FK)`, `number`, `state`, `merged (TINYINT)` |
| `github_events` | Webhook idempotency audit | `delivery_id (UNIQUE)`, `event`, `payload (JSON)`, `processed` |
| `monitors` | Configured API health targets | `url`, `method`, `expected_status`, `interval_minutes`, `active` |
| `monitor_checks` | Execution results of checks | `monitor_id (FK)`, `success`, `status_code`, `response_time_ms` |
| `incidents` | Downtime events log | `monitor_id (FK)`, `status (OPEN/RESOLVED)`, `reason`, `started_at` |

---

## 6. Deep Dive: How Key Features Work

### Dual-Token JWT Security with HTTP-Only Cookies
1. User authenticates via `/api/auth/login` or GitHub OAuth.
2. Server signs an **Access Token** (15m expiry) and a **Refresh Token** (7d expiry).
3. Server returns tokens via HTTP-Only, `SameSite=Lax` cookies. JavaScript cannot access the cookies via `document.cookie`, preventing XSS token theft.
4. When access token expires, Axios response interceptor catches the 401 error, transparently hits `/api/auth/refresh`, revokes the old refresh token in MySQL, issues a new token pair, and retries the original request.

### GitHub Webhook Verification & Asynchronous Processing Pipeline
1. GitHub posts a webhook payload to `/api/webhooks/github`.
2. Middleware reads raw body buffer (`req.rawBody`) and computes HMAC-SHA256 signature using `GITHUB_WEBHOOK_SECRET`.
3. If signature fails, returns 401 immediately.
4. System checks `github_events` for `X-GitHub-Delivery` ID. If present, returns 200 immediately (Idempotent bypass).
5. Stores event in `github_events` and enqueues job into BullMQ `githubEventQueue`. Returns HTTP 200 to GitHub in <50ms.
6. BullMQ worker picks up job:
   - For `push` events: parses commit message regex (`/#(\d+)/g`), finds matching Issue `#142`, links commit in `github_commits`, updates issue activity stream, and emits a Socket.IO event.

### BullMQ Repeatable API Health Check Engine
1. When a user creates a Monitor (`GET /api/health`, interval 5 min), `monitorService` schedules a BullMQ repeatable job.
2. Every 5 minutes, BullMQ triggers `monitorWorker`.
3. Worker sends an HTTP request using Axios with configured timeout (e.g. 30s).
4. Records check execution in `monitor_checks` table (`response_time_ms`, `status_code`, `success`).
5. **Incident Automation**:
   - If check fails and no open incident exists: Creates record in `incidents` (`status: OPEN`), emits `monitor:incident` WebSocket event, and pushes notification to project members.
   - If check succeeds and open incident exists: Updates incident (`status: RESOLVED`, `resolved_at: NOW()`), and emits recovery alert.

### Socket.IO Real-Time Synchronization
- On WebSocket handshake, server extracts JWT from HTTP cookie or handshake auth object.
- Connects socket and joins personal room (`user:{userId}`).
- Client triggers `joinWorkspace(workspaceId)` or `joinProject(projectId)`.
- When an issue state changes on Kanban, backend calls `io.to('project:' + projectId).emit('issue:updated', issue)`.
- Connected browsers instantly re-render the drag-and-drop card position without needing a full page reload.

---

## 7. Complete REST API Endpoint Directory

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create new user account
- `POST /api/auth/login` — Authenticate credentials & set HTTP-only cookies
- `POST /api/auth/logout` — Clear auth cookies & revoke refresh token
- `POST /api/auth/refresh` — Rotate refresh token & return new access token
- `GET /api/auth/me` — Fetch current logged-in user profile
- `GET /api/auth/github` — Initiate GitHub OAuth flow
- `GET /api/auth/github/callback` — OAuth code exchange callback

### Workspaces (`/api/workspaces`)
- `GET /api/workspaces` — List workspaces for current user
- `POST /api/workspaces` — Create new workspace
- `GET /api/workspaces/:id` — Get workspace by ID
- `PATCH /api/workspaces/:id` — Update workspace details (Admin only)
- `DELETE /api/workspaces/:id` — Delete workspace (Owner only)
- `GET /api/workspaces/:id/members` — Get workspace members
- `POST /api/workspaces/:id/members` — Invite user to workspace

### Projects (`/api/projects`)
- `GET /api/projects?workspaceId=:id` — List projects in workspace
- `POST /api/projects` — Create project in workspace
- `GET /api/projects/:id` — Get project details
- `PATCH /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project

### Issues & Kanban (`/api/issues` / `/api/projects/:projectId/issues`)
- `GET /api/projects/:projectId/issues` — Query issues (with status, priority, search, pagination)
- `GET /api/projects/:projectId/issues/kanban` — Get issues formatted for 4 Kanban columns
- `POST /api/projects/:projectId/issues` — Create new issue
- `GET /api/issues/:id` — Get full issue details with linked commits & comments
- `PATCH /api/issues/:id` — Update issue status/priority/assignee/labels
- `DELETE /api/issues/:id` — Delete issue

### Comments (`/api/comments` / `/api/issues/:issueId/comments`)
- `GET /api/issues/:issueId/comments` — Get comments for issue
- `POST /api/issues/:issueId/comments` — Post comment (parses `@mentions`)
- `DELETE /api/comments/:id` — Delete comment

### API Monitoring (`/api/monitors`)
- `GET /api/monitors?projectId=:id` — List monitors for project/workspace
- `POST /api/monitors` — Create endpoint health monitor
- `GET /api/monitors/:id/checks` — Fetch historical health check logs
- `GET /api/monitors/:id/incidents` — Fetch incident logs
- `PATCH /api/monitors/:id/toggle` — Pause/Resume health check monitoring

### GitHub Integration (`/api/github`)
- `GET /api/github/repositories` — Fetch user repositories from GitHub REST API
- `POST /api/github/repositories/connect` — Connect GitHub repo to DevPulse project
- `DELETE /api/github/repositories/:id` — Disconnect repository
- `GET /api/github/repositories/:id/commits` — Fetch commits synced from repo
- `GET /api/github/repositories/:id/pulls` — Fetch pull requests synced

### Webhooks (`/api/webhooks`)
- `POST /api/webhooks/github` — GitHub raw webhook endpoint (HMAC signature validated)

---

## 8. Installation, Local Setup & Environment Configuration

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Docker & Docker Compose**: Installed and running
- **Git**

### Step-by-Step Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-username/DevPulse.git
   cd DevPulse
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the project root (copy from `.env.example`):
   ```env
   NODE_ENV=development
   PORT=5000

   # MySQL Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=devpulse
   DB_PASSWORD=devpulse_pass
   DB_NAME=devpulse

   # Redis Configuration
   REDIS_URL=redis://localhost:6379

   # JWT Secrets
   JWT_SECRET=devpulse_super_secret_access_key_change_in_production
   JWT_REFRESH_SECRET=devpulse_super_secret_refresh_key_change_in_production
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # GitHub Integration (OAuth App)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
   GITHUB_WEBHOOK_SECRET=your_webhook_secret_key

   # Frontend URLs
   CORS_ORIGIN=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_WS_URL=http://localhost:5000
   ```

3. **Start MySQL & Redis Containers**:
   ```bash
   docker-compose up -d
   ```

4. **Install Dependencies & Launch Services**:

   **Option A: Run Backend API**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The backend will boot up on `http://localhost:5000` and automatically execute `schema.sql` to initialize all 21 tables in MySQL.*

   **Option B: Run Frontend UI**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The Next.js client will boot up on `http://localhost:3000`.*

---

## 9. Testing Suite

### Backend Unit & Integration Tests (Jest + Supertest)
```bash
cd backend
npm test
```
Tests cover:
- Authentication & JWT cookie management
- Workspace & project creation
- Issue status updates & Kanban logic
- Webhook signature validation & idempotency checks
- API health check recording

### Frontend End-to-End Tests (Playwright)
```bash
cd frontend
npx playwright test
```

---

## 10. Project Directory Structure

```
DevPulse/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # mysql2 connection pool & schema runner
│   │   │   ├── env.js           # Environment configuration & validation
│   │   │   ├── redis.js         # ioredis client singleton
│   │   │   └── schema.sql       # Native DDL for 21 MySQL tables
│   │   ├── controllers/         # Express request handlers
│   │   ├── middleware/          # Auth, RBAC, Rate Limiter, Error Handler, Audit
│   │   ├── repositories/        # Raw MySQL SQL queries with parameter binding
│   │   ├── routes/              # Express API routers
│   │   ├── services/            # Core business logic
│   │   ├── utils/               # Logger, API response helpers, JWT, Crypto
│   │   ├── validators/          # Zod request validation schemas
│   │   ├── websockets/          # Socket.IO server & room subscriptions
│   │   └── workers/             # BullMQ background queue processors
│   ├── tests/                   # Jest + Supertest test suites
│   ├── package.json
│   └── nodemon.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router Pages
│   │   │   ├── (app)/           # Protected workspace routes (Dashboard, Kanban, Settings)
│   │   │   ├── (auth)/          # Authentication pages (Login, Register)
│   │   │   └── layout.js        # Root application layout
│   │   ├── components/          # Reusable UI, Layout, Kanban, Monitoring components
│   │   ├── hooks/               # React hooks for auth, sockets, and queries
│   │   ├── lib/                 # Central Axios API client & Socket instance
│   │   └── stores/              # Zustand global state stores
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── jsconfig.json
│
├── docker-compose.yml           # MySQL 8 + Redis 7 container orchestration
├── .github/workflows/ci.yml     # GitHub Actions CI pipeline
└── README.md                    # Platform documentation
```

---

## 📄 License

This project is licensed under the **MIT License**.
