# NestJS Boilerplate (Production-Ready)

A scalable, production-ready **NestJS boilerplate** built with best practices in mind.
It includes authentication, authorization, Prisma ORM, Docker support, and a modular architecture to help you ship faster.

---

## Features

* **NestJS** with modular architecture
* **Prisma ORM** (type-safe database access)
* **JWT Authentication** (access + refresh tokens)
* **Role & Permission-based Authorization**
* **Reusable Common Layer** (guards, filters, interceptors, decorators)
* **Dockerized Setup**
* **E2E Testing (Jest)**
* **Linting & Formatting** (ESLint, Commitlint, Lint-Staged)
* **Pagination Utility**
* **Secure Key Handling (PEM support)**

---

## Project Structure

```
src/
├── common/        # Shared utilities (guards, decorators, filters, interceptors)
├── config/        # App & environment configuration
├── constants/     # Static constants
├── database/      # Prisma setup and service
├── lib/           # Helper libraries (pagination, etc.)
├── modules/       # Feature modules (auth, user, token)
└── main.ts        # Application entry point
```

### Key Modules

* **Auth Module**

  * Login & token refresh
  * JWT strategy
* **User Module**

  * User CRUD operations
* **Token Module**

  * Token persistence & management

---

## Tech Stack

* **Framework:** NestJS
* **Database:** Prisma ORM
* **Auth:** JWT (Access + Refresh)
* **Containerization:** Docker
* **Testing:** Jest
* **Package Manager:** pnpm

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/logicalHassan/nest-bolierplate.git
cd nest-bolierplate
```

### 2. Install dependencies

```bash
pnpm install
```

---

## Environment Setup

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/db"
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="15m"
```

---

## Database Setup (Prisma)

### Run migrations

```bash
pnpm prisma migrate dev
```

### Generate Prisma client

```bash
pnpm prisma generate
```

### Seed database

```bash
pnpm prisma db seed
```

---

## Running with Docker

```bash
docker-compose up --build
```

Or use helper script:

```bash
./start-docker.sh
```

---

## Running the App

### Development

```bash
pnpm dev
```

### Production

```bash
pnpm build
pnpm start:prod
```

---

## Authentication Flow

1. User logs in → receives **access token + refresh token**
2. Access token used for protected routes
3. Refresh token used to generate new access tokens

---

## Authorization System

* **Roles Decorator**
* **Permissions Decorator**
* **Guards**

  * JWT Guard
  * Permissions Guard

Example:

```ts
@Roles('admin')
@Permissions('user:create')
```

---

## Common Layer

Reusable utilities located in `src/common`:

### Guards

* JWT Authentication
* Permission-based access

### Filters

* Global exception handler
* Prisma exception handler

### Interceptors

* Logging interceptor

### Decorators

* `@User()`
* `@Roles()`
* `@Permissions()`

---

## Utilities

* **Pagination helper**
* **Password hashing utilities**
* **Null/undefined cleaner**
* **Object transformation helpers**

---

## Security

* JWT-based authentication
* Encrypted password handling
* PEM key support for secure integrations

---

## Testing

Run E2E tests:

```bash
pnpm test:e2e
```

---

## Linting & Code Quality

```bash
pnpm lint
```

* ESLint configured
* Commitlint for commit message standards
* Lint-staged for pre-commit checks

---

## API Documentation

You can integrate Swagger easily if needed.

(Add Swagger setup here if you enable it)

---

## License

MIT License

---

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create your feature branch
3. Commit changes
4. Open a PR

---

## Philosophy

This boilerplate focuses on:

* Scalability
* Clean architecture
* Developer experience
* Production readiness

---

## Author Notes

This setup is ideal for:

* SaaS backends
* Startup MVPs
* Scalable APIs
* Enterprise-ready services

---

## Support

If you find this useful, consider giving it a star ⭐
