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

/**
 * ≥5 organizations; first org has ≥4 admins. Others have one admin each.
 * Optional `members` use `createdByAdminEmail` to set `createdById` (audit: which admin “created” them).
 * Password for all seeded users: `SEED_ADMIN_PASSWORD` in `.env`.
 */
const SEED_DATA: Array<{
  orgName: string;
  admins: Array<{ email: string; name: string }>;
  members?: Array<{
    email: string;
    name: string;
    createdByAdminEmail: string;
  }>;
}> = [
  {
    orgName: 'Acme Corporation',
    admins: [
      { email: 'admin1@acme.demo', name: 'Acme Admin One' },
      { email: 'admin2@acme.demo', name: 'Acme Admin Two' },
      { email: 'admin3@acme.demo', name: 'Acme Admin Three' },
      { email: 'admin4@acme.demo', name: 'Acme Admin Four' },
    ],
    members: [
      {
        email: 'member1@acme.demo',
        name: 'Acme Member One',
        createdByAdminEmail: 'admin1@acme.demo',
      },
      {
        email: 'member2@acme.demo',
        name: 'Acme Member Two',
        createdByAdminEmail: 'admin1@acme.demo',
      },
    ],
  },
  {
    orgName: 'Globex Industries',
    admins: [{ email: 'admin@globex.demo', name: 'Globex Admin' }],
    members: [
      {
        email: 'member@globex.demo',
        name: 'Globex Member',
        createdByAdminEmail: 'admin@globex.demo',
      },
    ],
  },
  {
    orgName: 'Initech Solutions',
    admins: [{ email: 'admin@initech.demo', name: 'Initech Admin' }],
    members: [
      {
        email: 'member@initech.demo',
        name: 'Initech Member',
        createdByAdminEmail: 'admin@initech.demo',
      },
    ],
  },
  {
    orgName: 'Umbrella Corporation',
    admins: [{ email: 'admin@umbrella.demo', name: 'Umbrella Admin' }],
    members: [
      {
        email: 'member@umbrella.demo',
        name: 'Umbrella Member',
        createdByAdminEmail: 'admin@umbrella.demo',
      },
    ],
  },
  {
    orgName: 'Stark Industries',
    admins: [{ email: 'admin@stark.demo', name: 'Stark Admin' }],
    members: [
      {
        email: 'member@stark.demo',
        name: 'Stark Member',
        createdByAdminEmail: 'admin@stark.demo',
      },
    ],
  },
];

async function main() {
  const defaultPassword =
    process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@123!';

  let orgsEnsured = 0;
  let usersCreated = 0;
  let usersSkipped = 0;

  for (const block of SEED_DATA) {
    let organization = await prisma.organization.findFirst({
      where: { name: block.orgName },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: { name: block.orgName },
      });
      orgsEnsured += 1;
      console.log(`Created organization "${block.orgName}" (${organization.id})`);
    } else {
      console.log(`Organization exists: "${block.orgName}" (${organization.id})`);
    }

    const hashedPassword = await hashPassword(defaultPassword);

    const adminIdByEmail = new Map<string, string>();

    for (const admin of block.admins) {
      const email = admin.email.toLowerCase();

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        console.log(`  Skip admin: ${email}`);
        adminIdByEmail.set(email, existing.id);
        usersSkipped += 1;
        continue;
      }

      const created = await prisma.user.create({
        data: {
          email,
          name: admin.name,
          password: hashedPassword,
          role: UserRole.admin,
          organizationId: organization.id,
        },
        select: { id: true },
      });

      adminIdByEmail.set(email, created.id);
      console.log(`  Created admin: ${email} → ${block.orgName}`);
      usersCreated += 1;
    }

    for (const member of block.members ?? []) {
      const email = member.email.toLowerCase();
      const creatorEmail = member.createdByAdminEmail.toLowerCase();
      const createdById = adminIdByEmail.get(creatorEmail);

      if (!createdById) {
        throw new Error(
          `Seed: no admin id for "${creatorEmail}" (needed to create ${email})`,
        );
      }

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        console.log(`  Skip member: ${email}`);
        usersSkipped += 1;
        continue;
      }

      await prisma.user.create({
        data: {
          email,
          name: member.name,
          password: hashedPassword,
          role: UserRole.member,
          organizationId: organization.id,
          createdById,
        },
      });

      console.log(`  Created member: ${email} (createdBy ${creatorEmail}) → ${block.orgName}`);
      usersCreated += 1;
    }
  }

  console.log(
    `\nSeed summary: ${orgsEnsured} new org(s), ${usersCreated} user(s) created, ${usersSkipped} user(s) skipped. Password: SEED_ADMIN_PASSWORD`,
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
