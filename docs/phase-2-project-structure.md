# Phase 2: Project Structure

## Architecture

โปรเจกต์ใช้โครงสร้างแบบ monorepo แยก frontend และ backend ชัดเจน เพื่อให้พัฒนาและ deploy ได้ยืดหยุ่น

```text
loan/
├── frontend/              # Next.js, React, Tailwind CSS
├── backend/               # Node.js, Express, TypeScript
├── database/              # MySQL migrations and seeds
├── docs/                  # Analysis and project documentation
├── docker-compose.yml     # Local MySQL service
├── package.json           # Root workspace scripts
└── .env.example           # Environment template
```

## Frontend Structure

```text
frontend/
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # Shared UI components
│   ├── features/          # Feature-specific screens and logic
│   ├── lib/               # API client and shared helpers
│   └── types/             # Shared TypeScript types
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

Planned feature folders:

- `features/auth`
- `features/dashboard`
- `features/loans`
- `features/approvals`
- `features/repayments`
- `features/extensions`
- `features/notices`
- `features/reports`
- `features/admin`

## Backend Structure

```text
backend/
├── src/
│   ├── config/            # Environment and database config
│   ├── middlewares/       # Auth, error handler, validation
│   ├── modules/           # Domain modules
│   ├── routes/            # API router composition
│   ├── app.ts             # Express app setup
│   └── server.ts          # HTTP server entrypoint
├── package.json
└── tsconfig.json
```

Planned backend modules:

- `auth`
- `users`
- `loans`
- `approvals`
- `payments`
- `repayments`
- `extensions`
- `notices`
- `reports`

Each module should use this shape when implemented:

```text
module-name/
├── controller.ts
├── service.ts
├── repository.ts
├── routes.ts
├── schema.ts
└── types.ts
```

## Database Structure

```text
database/
├── migrations/
└── seeds/
```

Phase 3 will add SQL schema and seed data. The first migration should create the database tables identified in Phase 1.

## Local Development

1. Copy `.env.example` to `.env`
2. Install dependencies in root, frontend, and backend
3. Start MySQL with Docker Compose
4. Run the frontend and backend development servers

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
docker compose up -d mysql
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`
- Backend Health: `http://localhost:4000/health`
- MySQL: `localhost:3307`

## Phase 2 Acceptance Criteria

- Frontend folder exists with Next.js, TypeScript, and Tailwind CSS config
- Backend folder exists with Express, TypeScript, environment config, database pool, and health route
- Database folder exists with migration and seed placeholders
- Root scripts exist for local development
- Documentation explains where future modules should be implemented
