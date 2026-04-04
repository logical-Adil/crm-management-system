/* eslint-disable no-console */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '@/common/utils/password.utils';

import { PrismaClient, UserRole } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** Demo companies + one `admin` user each (unique emails). Password: `SEED_ADMIN_PASSWORD` for all. */
const SEED_COMPANIES: Array<{
  orgName: string;
  adminEmail: string;
  adminName: string;
}> = [
  {
    orgName: 'Acme Corporation',
    adminEmail: 'admin@acme.demo',
    adminName: 'Acme Admin',
  },
  {
    orgName: 'Globex Industries',
    adminEmail: 'admin@globex.demo',
    adminName: 'Globex Admin',
  },
  {
    orgName: 'Initech Solutions',
    adminEmail: 'admin@initech.demo',
    adminName: 'Initech Admin',
  },
];

async function main() {
  const defaultPassword =
    process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@123!';

  let created = 0;
  let skipped = 0;

  for (const row of SEED_COMPANIES) {
    const email = row.adminEmail.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      console.log(`Skip: user already exists (${email})`);
      skipped += 1;
      continue;
    }

    const hashedPassword = await hashPassword(defaultPassword);

    const organization = await prisma.organization.create({
      data: { name: row.orgName },
    });

    await prisma.user.create({
      data: {
        email,
        name: row.adminName,
        password: hashedPassword,
        role: UserRole.admin,
        organizationId: organization.id,
      },
    });

    console.log(
      `Created org "${row.orgName}" + admin ${email} (org id: ${organization.id})`,
    );
    created += 1;
  }

  console.log(
    `\nSeeding finished: ${created} created, ${skipped} skipped (password from SEED_ADMIN_PASSWORD).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
