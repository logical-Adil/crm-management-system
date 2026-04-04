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

## 4. Customers

All customer routes require Bearer (same `organizationId` as the JWT). Customer JSON includes **`deletedAt`** (null = active, set when soft-deleted).

**Read vs write:** **`GET /api/v1/customers`** and **`GET /api/v1/customers/:id`** are **organization-wide** — any authenticated member can list or view details (+ **notes**) for any customer in the org. The list only includes **active** customers (`deletedAt` is always `null` there). **`GET :id`** can also return a **soft-deleted** customer in your org (`deletedAt` set).

**Mutations** (create, update, delete, restore, assign) apply only to customers **assigned to you** (`assignedToId` = your user id), except **POST create** which sets you as assignee.

**Limits:** At most **5 active** (non-deleted) customers per user—enforced on create, assign, and restore. Create/assign/restore use DB transactions (**serializable** isolation) so concurrent requests cannot exceed the limit (race protection).

| Endpoint | Bearer | Who can call | Path params | Query | Body |
|----------|--------|--------------|-------------|-------|------|
| `GET /api/v1/customers` | Yes | **Any authenticated user** — **all active** customers in **your organization** (paginated / searchable) | — | `page`, `limit` (optional), `search` (optional — matches name or email, case-insensitive) | — |
| `POST /api/v1/customers` | Yes | **Any authenticated user** — creates with **you** as assignee; fails if you already have 5 active | — | — | `name`, `email`, `phone` (optional) |
| `GET /api/v1/customers/:id` | Yes | **Any authenticated user** — **any** customer in **your organization** (active or soft-deleted), with **notes** | `id` — customer UUID | — | — |
| `PATCH /api/v1/customers/:id` | Yes | **Any authenticated user** — **only your** active customer | `id` | — | JSON: optional `name`, `email`, `phone` |
| `DELETE /api/v1/customers/:id` | Yes | **Any authenticated user** — **soft delete** only **your** active customer | `id` | — | — |
| `POST /api/v1/customers/:id/restore` | Yes | **Any authenticated user** — **only your** soft-deleted customer; fails if you already have 5 active | `id` | — | — |
| `PATCH /api/v1/customers/:id/assign` | Yes | **Any authenticated user** — reassign **your** active customer to another user **in your org**; target must have &lt; 5 active | `id` | — | `assignToUserId` (UUID) |

**`GET /api/v1/customers/:id` response** includes the customer fields (including `deletedAt`) and embedded **`notes`** (newest first). You do **not** need to be the assignee to read; you do need to be the assignee to **PATCH** / **DELETE** / **restore** / **assign**.

**Create example:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+15551234567"
}
```

**Update example:**

```json
{
  "name": "Jane D.",
  "email": "jane.doe@example.com"
}
```

**Assign example** (give the customer to a colleague in the same organization):

```json
{
  "assignToUserId": "<uuid of user in your org>"
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
| GET | `http://localhost:5000/api/v1/customers` |
| POST | `http://localhost:5000/api/v1/customers` |
| GET | `http://localhost:5000/api/v1/customers/:id` |
| PATCH | `http://localhost:5000/api/v1/customers/:id` |
| DELETE | `http://localhost:5000/api/v1/customers/:id` |
| POST | `http://localhost:5000/api/v1/customers/:id/restore` |
| PATCH | `http://localhost:5000/api/v1/customers/:id/assign` |
