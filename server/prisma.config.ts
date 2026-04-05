import 'dotenv/config';

import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI (migrate, db push, seed): uses DIRECT_URL if set (e.g. direct connection alongside a pooler URL), otherwise DATABASE_URL.
 * For a normal Postgres instance (local or Docker), set DATABASE_URL only — see server/.env.example.
 */
function prismaCliDatasourceUrl(): string {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Missing DATABASE_URL (and optional DIRECT_URL). Add DATABASE_URL to server/.env — see .env.example.',
    );
  }
  return url;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node -r tsconfig-paths/register -r ts-node/register prisma/seed.ts',
  },
  datasource: {
    url: prismaCliDatasourceUrl(),
  },
});
