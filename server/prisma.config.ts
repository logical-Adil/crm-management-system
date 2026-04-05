import 'dotenv/config';

import { defineConfig } from 'prisma/config';

// /**
//  * Prisma CLI (migrate, db push, seed): prefers DIRECT_URL when set (Supabase session pooler or direct Postgres).
//  * Falls back to DATABASE_URL so local Docker / single-URL setups still work.
//  * For Supabase, set DATABASE_URL = transaction pooler :6543 and DIRECT_URL = session pooler :5432 (see .env.example).
//  */
// function prismaCliDatasourceUrl(): string {
//   const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
//   if (!url) {
//     throw new Error(
//       'Missing DATABASE_URL (and optional DIRECT_URL). Add DATABASE_URL to server/.env — see .env.example.',
//     );
//   }
//   return url;
// }

// export default defineConfig({
//   schema: 'prisma/schema.prisma',
//   migrations: {
//     path: 'prisma/migrations',
//     seed: 'node -r tsconfig-paths/register -r ts-node/register prisma/seed.ts',
//   },
//   datasource: {
//     url: prismaCliDatasourceUrl(),
//   },
// });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // FORCE the CLI to use the Direct/Session URL (Port 5432)
    url: process.env.DIRECT_URL,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node -r tsconfig-paths/register -r ts-node/register prisma/seed.ts',
  },
});
