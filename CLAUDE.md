# api-gateway — Agent Context

> Copy this file to the root of the api-gateway repo as `CLAUDE.md` when scaffolding.
> This service is Sprint 2 (Day 12–14). Do not implement before user-service and task-service are done.

---

## What This Service Does

`api-gateway` is the single entry point for all external traffic.
- Validates JWT on protected routes
- Injects `X-User-Id` + `X-User-Role` headers before forwarding
- Strips the `Authorization` header before forwarding (downstream services never see JWT)
- Routes `/api/users` and `/api/auth` → user-service
- Routes `/api/tasks` → task-service
- Exposes port 8080 to the host — this is the ONLY port clients hit

**Port:** 8080 (exposed to host)
**No database.** Gateway never touches a DB.

---

## Governing Document

**IRD-003** is the law for this service. Read it before writing any code.

| Location | URL |
|----------|-----|
| Local (docs repo) | `../docs-taskmanager/docs/IRD-003.md` |
| Notion | https://www.notion.so/341dde5fafa981be8ba2e5840eced914 |

---

## Routing Table

```
Public (no JWT required):
  POST /api/users          → user-service:3001/users
  POST /api/auth/login     → user-service:3001/auth/login

Protected (JWT required — validate, then inject headers):
  POST   /api/tasks                → task-service:3002/tasks
  GET    /api/tasks                → task-service:3002/tasks
  GET    /api/tasks/:id            → task-service:3002/tasks/:id
  PATCH  /api/tasks/:id/status     → task-service:3002/tasks/:id/status
  DELETE /api/tasks/:id            → task-service:3002/tasks/:id
  POST   /api/tasks/:id/comments   → task-service:3002/tasks/:id/comments
```

---

## JWT Middleware — 7-Step Logic

```
1. Extract token from Authorization: Bearer <token>
2. If no token on a protected route → 401 { "error": "No token provided" }
3. Verify signature using JWT_SECRET
4. If invalid/malformed → 401 { "error": "Invalid token" }
5. Check expiry
6. If expired → 401 { "error": "Token expired" }
7. If valid:
   a. Inject X-User-Id: <sub from payload>
   b. Inject X-User-Role: <role from payload>
   c. Strip Authorization header
   d. Forward request to downstream service
```

---

## Standards (locked — do not change)

| Rule | Value |
|------|-------|
| External port | 8080 |
| Error format | `{ "error": "string" }` — all responses from gateway |
| JWT secret | from `JWT_SECRET` env var |
| Downstream addresses | `user-service:3001`, `task-service:3002` (Docker DNS) |
| Health endpoint | `GET /health → 200 { "status": "ok" }` |
| Secrets | `.env` (git-ignored) + `.env.example` (committed) |

---

## Environment Variables

```env
# .env.example — commit this, not .env
PORT=8080
JWT_SECRET=
USER_SERVICE_URL=http://user-service:3001
TASK_SERVICE_URL=http://task-service:3002
```

---

## Sprint 2 Tasks for This Service

| Task | Owner | Description |
|------|-------|-------------|
| T-15 | chau_tv | Scaffold: npm init, TS, Express, /health, .env.example |
| T-16 | chau_tv | Routing table — proxy all routes to correct downstream |
| T-17 | thai_dm | JWT middleware — 7-step validation + header injection |
| T-18 | thai_dm | Error handling middleware + request logging |
| T-19 | chau_tv | Docker Compose full stack (all 3 services + 2 DBs) |

---

## Session Startup for This Service

```
1. Read IRD-003 (local or Notion) — full routing table + JWT middleware spec
2. Confirm user-service and task-service are working (test with curl)
3. Check which task you're on (see sprint-01.md in docs repo)
4. Implement — gateway connects what's already working
```
