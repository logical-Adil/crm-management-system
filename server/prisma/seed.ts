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

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@nestapp.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@123!';
  const orgName = process.env.SEED_ORG_NAME ?? 'Default organization';

  const userEmailNormalized = adminEmail.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: userEmailNormalized },
  });

  if (!existingUser) {
    const hashedPassword = await hashPassword(adminPassword);

    const organization = await prisma.organization.create({
      data: { name: orgName },
    });

    const admin = await prisma.user.create({
      data: {
        email: userEmailNormalized,
        name: 'Organization admin',
        password: hashedPassword,
        role: UserRole.admin,
        organizationId: organization.id,
        isActive: true,
      },
    });

    console.log('Organization and admin user created successfully.');
    console.log(`Organization: ${organization.name} (${organization.id})`);
    console.log(`Email: ${admin.email}`);
  } else {
    console.log('Seed admin user already exists. Skipping creation.');
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
