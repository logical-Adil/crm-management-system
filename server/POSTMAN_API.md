# Local API reference (Postman)

**Base URL:** `http://localhost:5000` — use `PORT` from `.env` if different.

**Path prefix:** `/api/v1` → full URL: `http://localhost:5000/api/v1/...`

Tables list the path after the host (e.g. `GET /api/v1/users/me`).

**Headers:** `Content-Type: application/json` when you send a JSON body.  
**Bearer** = `Authorization: Bearer <access_token>` (JWT from login/refresh: `tokens.access.token`).  
**Refresh token** = only inside JSON for `/auth/logout` and `/auth/refresh`, never as Bearer.

**Roles (JWT `role`):** `admin` has permission `users:manage`. `member` does not. Routes that require `users:manage` return **403** for members.

---

## 1. Auth

| Endpoint | Bearer | Who can call | Path params | Query | Body |
|----------|--------|--------------|-------------|-------|------|
| `POST /api/v1/auth/login` | No | **Public** — anyone (no login) | — | — | `email`, `password` |
| `POST /api/v1/auth/logout` | No | **Public** — anyone with a valid refresh token in body | — | — | `refreshToken` |
| `POST /api/v1/auth/refresh` | No | **Public** — anyone with a valid refresh token in body | — | — | `refreshToken` |

**Login example:**

```json
{
  "email": "admin1@acme.demo",
  "password": "<SEED_ADMIN_PASSWORD from .env>"
}
```

Seeded admins: Acme `admin1@acme.demo`–`admin4@acme.demo`; Globex, Initech, Umbrella, Stark — see `prisma/seed.ts`.

**Logout / refresh example:**

```json
{
  "refreshToken": "<tokens.refresh.token>"
}
```

---

## 2. Organizations

| Endpoint | Bearer | Who can call | Path params | Query | Body |
|----------|--------|--------------|-------------|-------|------|
| `GET /api/v1/organizations` | Yes | **Any authenticated user** — `admin` or `member` | — | — | — |

---

## 3. Users

| Endpoint | Bearer | Who can call | Path params | Query | Body |
|----------|--------|--------------|-------------|-------|------|
| `GET /api/v1/users/me` | Yes | **Any authenticated user** — `admin` or `member` | — | — | — |
| `POST /api/v1/users` | Yes | **Admin only** — needs `users:manage` | — | — | JSON: create user |
| `GET /api/v1/users` | Yes | **Admin only** | — | `page`, `limit` (optional) | — |
| `GET /api/v1/users/:id` | Yes | **Admin only** | `id` — user UUID (same org as JWT) | — | — |
| `PATCH /api/v1/users/:id` | Yes | **Admin only** | `id` — user UUID (same org as JWT) | — | JSON: optional `name`, `role` |
| `DELETE /api/v1/users/:id` | Yes | **Admin only** | `id` — user UUID (same org as JWT) | — | — |

**`:id` rule (admin routes):** User must be in the **same organization** as the JWT; get ids from `GET /users` or your own id from `GET /users/me` — else **404**.

**Sensitive:** Keep Bearer in Postman variables; use fake data in examples.

**Create (admin):**

```json
{
  "email": "member.example@yourdomain.test",
  "password": "<min 10 chars>",
  "name": "New Member",
  "role": "member"
}
```

**Patch (admin):**

```json
{
  "name": "Updated Name",
  "role": "admin"
}
```

---

## Suggested order

1. `POST /auth/login` → save access + refresh tokens.  
2. Set Bearer = access token for protected routes.  
3. `POST /auth/refresh` / `POST /auth/logout` as needed (body only, no Bearer).

---

## Full paths (local)

| Method | URL |
|--------|-----|
| POST | `http://localhost:5000/api/v1/auth/login` |
| POST | `http://localhost:5000/api/v1/auth/logout` |
| POST | `http://localhost:5000/api/v1/auth/refresh` |
| GET | `http://localhost:5000/api/v1/organizations` |
| GET | `http://localhost:5000/api/v1/users/me` |
| POST | `http://localhost:5000/api/v1/users` |
| GET | `http://localhost:5000/api/v1/users` |
| GET | `http://localhost:5000/api/v1/users/:id` |
| PATCH | `http://localhost:5000/api/v1/users/:id` |
| DELETE | `http://localhost:5000/api/v1/users/:id` |
