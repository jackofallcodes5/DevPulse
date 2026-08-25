# 🚀 DevPulse — Developer Collaboration & API Monitoring Platform

> A real-time developer workspace combining project management, GitHub activity, API monitoring, and team collaboration.

## ✨ Key Features

- 🔐 **Authentication & RBAC** — JWT access/refresh tokens, HTTP-only cookies, GitHub OAuth, and workspace/project roles.
- 📋 **Kanban Project Management** — Real-time drag-and-drop issues with priorities, labels, assignees, and due dates.
- 🐙 **GitHub Integration** — Repository connection, OAuth, webhook processing, commit tracking, and issue linking.
- ⚡ **API Monitoring** — Automated health checks, response-time tracking, downtime detection, incidents, and recovery alerts.
- 🔔 **Real-Time Collaboration** — Socket.IO notifications, mentions, project updates, and live Kanban synchronization.
- 📊 **Engineering Analytics** — Issue statistics, commit activity, and API latency visualizations.

## 🛠️ Tech Stack

**Frontend:** Next.js 14 • React • Tailwind CSS • TanStack Query • Zustand • Recharts • Socket.IO

**Backend:** Node.js • Express.js • Socket.IO • BullMQ • Zod • Winston

**Database & Infrastructure:** MySQL 8 • Redis 7 • Docker • GitHub Actions

**Testing:** Jest • Supertest • Playwright

## 🏗️ Architecture

```text
Next.js Frontend
       │
       ├── REST API / WebSockets
       ▼
Express.js Backend
       │
       ├── Services & Controllers
       ├── Socket.IO
       ├── BullMQ Workers
       ▼
 ┌───────────────┬───────────────┬───────────────┐
 │    MySQL      │     Redis     │    GitHub     │
 │  21 Tables    │ Queue/Cache   │ OAuth/Webhook │
 └───────────────┴───────────────┴───────────────┘
```

## 🔒 Security

- Dual-token JWT authentication with HTTP-only cookies
- Argon2id password hashing
- Role-based access control
- GitHub webhook HMAC-SHA256 verification
- Rate limiting and security headers
- Request validation with Zod

## 📁 Project Structure

```text
DevPulse/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── websockets/
│   │   └── workers/
│   └── tests/
├── frontend/
│   └── src/
├── docker-compose.yml
└── README.md
```

## 🚀 Setup

### Requirements

- Node.js 20+
- Docker & Docker Compose
- Git

### Run

```bash
git clone https://github.com/your-username/DevPulse.git
cd DevPulse

docker-compose up -d

cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the required environment variables in `.env` for MySQL, Redis, JWT, GitHub OAuth, webhook security, and frontend/backend URLs.

## 🧪 Testing

```bash
cd backend
npm test
```

```bash
cd frontend
npx playwright test
```

## 📄 License

MIT License
