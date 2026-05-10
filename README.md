# 🚀 Collab Notes — Real-Time Collaborative Notes Platform

A production-ready microservice-based collaborative notes platform.

## 🏗️ Architecture

```
collab-notes/
├── services/
│   ├── api-gateway/          # HTTP entry point, JWT validation, Swagger docs
│   ├── auth-service/         # JWT auth, signup/login/refresh (NATS microservice)
│   ├── user-service/         # User profiles (NATS microservice)
│   ├── notes-service/        # Note CRUD, sharing, permissions (NATS microservice)
│   ├── collaboration-service/ # WebSocket gateway, Redis presence
│   ├── history-service/      # Note revision history (NATS microservice)
│   ├── comment-service/      # Inline comments & threads (NATS microservice)
│   └── notification-service/ # Notifications (NATS microservice)
├── packages/
│   └── shared-contracts/     # NATS event types & payloads
├── infra/
│   ├── nginx/nginx.conf      # Reverse proxy
│   └── postgres/init.sql     # DB initialization
└── docker-compose.yml        # Full stack orchestration
```

## ⚡ Quick Start

```bash
# 1. Copy .env (already configured for local Docker)
cp .env .env.local

# 2. Start everything
docker compose up --build

# 3. Run Prisma migrations (first time only, after containers start)
docker compose exec auth-service npx prisma migrate dev --name init
docker compose exec user-service npx prisma migrate dev --name init
docker compose exec notes-service npx prisma migrate dev --name init
docker compose exec history-service npx prisma migrate dev --name init
docker compose exec comment-service npx prisma migrate dev --name init
docker compose exec notification-service npx prisma migrate dev --name init
```

## 🌐 Endpoints

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/docs |
| Nginx (production) | http://localhost:80 |
| Collab WebSocket | ws://localhost:3004/collab |
| NATS Monitoring | http://localhost:8222 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## 🔌 WebSocket Events (Collaboration Service)

Connect to `ws://localhost:3004/collab` with `auth: { token: '<JWT>' }`.

| Event (Client → Server) | Payload |
|------------------------|---------|
| `join-note` | `{ noteId }` |
| `leave-note` | `{ noteId }` |
| `doc-update` | `{ noteId, content }` |
| `cursor-update` | `{ noteId, position }` |
| `typing-start` | `{ noteId }` |
| `typing-stop` | `{ noteId }` |

| Event (Server → Client) | Payload |
|------------------------|---------|
| `doc-synced` | `{ content, authorId, timestamp }` |
| `collaborator-joined` | `{ userId, socketId }` |
| `collaborator-left` | `{ userId }` |
| `cursor-moved` | `{ userId, position }` |
| `typing` | `{ userId, isTyping }` |

## 📡 NATS Events

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `note.created` | notes-service | - |
| `note.updated` | notes-service | history-service |
| `note.shared` | notes-service | notification-service |
| `comment.added` | comment-service | notification-service |
| `comment.mentioned` | comment-service | notification-service |
| `comment.resolved` | comment-service | notification-service |
| `user.registered` | auth-service | user-service |

## 🗄️ Databases

| Service | Database |
|---------|----------|
| auth-service | auth_db |
| user-service | user_db |
| notes-service | notes_db |
| history-service | history_db |
| comment-service | comments_db |
| notification-service | notifications_db |

## 🐳 Docker Services

```bash
docker compose up --build        # Full stack
docker compose up postgres nats redis  # Infra only
docker compose down -v           # Stop + remove volumes
docker compose logs -f auth-service    # Tail logs
```

## 📦 Tech Stack

- **Backend**: NestJS 11, TypeScript 5
- **Communication**: NATS (async), WebSockets/Socket.IO (real-time)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache/Presence**: Redis 7
- **API Gateway**: NestJS HTTP + Swagger + JWT + Throttler
- **Infrastructure**: Docker Compose, Nginx
