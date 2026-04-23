/* eslint-disable no-console */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { MAX_CUSTOMERS_PER_USER } from '@/constants/customer.constants';
import { hashPassword } from '@/common/utils/password.utils';

import { PrismaClient, UserRole } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** Primary demo org: 18 admins + 50 members + bulk customers / notes (500+ rows for pagination). */
const ACME_ORG_NAME = 'Acme Corporation';

const ACME_ADMIN_COUNT = 18;
const ACME_MEMBER_COUNT = 50;

/**
 * Active customers in Acme for list/pagination testing. Assignees are filled round-robin up to
 * MAX_CUSTOMERS_PER_USER each; overflow rows are unassigned (`assignedToId: null`).
 */
const ACME_ACTIVE_CUSTOMERS = 520;

/** Soft-deleted customers in Acme (for restore / list tests). */
const ACME_SOFT_DELETED_CUSTOMERS = 55;

/** Smaller orgs: one admin + one member each; light customer rows. */
const OTHER_ORGS: Array<{
  orgName: string;
  admin: { email: string; name: string };
  member: { email: string; name: string };
}> = [
  {
    orgName: 'Globex Industries',
    admin: { email: 'admin@globex.demo', name: 'Globex Admin' },
    member: { email: 'member@globex.demo', name: 'Globex Member' },
  },
  {
    orgName: 'Initech Solutions',
    admin: { email: 'admin@initech.demo', name: 'Initech Admin' },
    member: { email: 'member@initech.demo', name: 'Initech Member' },
  },
  {
    orgName: 'Umbrella Corporation',
    admin: { email: 'admin@umbrella.demo', name: 'Umbrella Admin' },
    member: { email: 'member@umbrella.demo', name: 'Umbrella Member' },
  },
  {
    orgName: 'Stark Industries',
    admin: { email: 'admin@stark.demo', name: 'Stark Admin' },
    member: { email: 'member@stark.demo', name: 'Stark Member' },
  },
];

function pickAssignee(
  userIds: string[],
  activeCounts: Map<string, number>,
  startIndex: number,
): { userId: string; nextStart: number } | null {
  const n = userIds.length;
  if (n === 0) {
    return null;
  }
  for (let k = 0; k < n; k++) {
    const idx = (startIndex + k) % n;
    const uid = userIds[idx];
    if ((activeCounts.get(uid) ?? 0) < MAX_CUSTOMERS_PER_USER) {
      return { userId: uid, nextStart: (idx + 1) % n };
    }
  }
  return null;
}

async function ensureAcmeUsers(
  organizationId: string,
  hashedPassword: string,
) {
  let usersCreated = 0;
  let usersSkipped = 0;

  const adminIdByEmail = new Map<string, string>();

  for (let i = 1; i <= ACME_ADMIN_COUNT; i++) {
    const email = `admin${i}@acme.demo`.toLowerCase();
    const name = `Acme Admin ${i}`;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          password: hashedPassword,
          role: UserRole.admin,
          organizationId,
          isActive: true,
        },
      });
      adminIdByEmail.set(email, existing.id);
      console.log(`  Updated admin password: ${email}`);
      usersSkipped += 1;
      continue;
    }

    const created = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: UserRole.admin,
        organizationId,
        isActive: true,
      },
      select: { id: true },
    });
    adminIdByEmail.set(email, created.id);
    console.log(`  Created admin: ${email}`);
    usersCreated += 1;
  }

  const admin1Id = adminIdByEmail.get('admin1@acme.demo');
  if (!admin1Id) {
    throw new Error('Seed: admin1@acme.demo is required');
  }

  for (let i = 1; i <= ACME_MEMBER_COUNT; i++) {
    const email = `member${i}@acme.demo`.toLowerCase();
    const name = `Acme Member ${i}`;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          password: hashedPassword,
          role: UserRole.member,
          organizationId,
          isActive: true,
          createdById: admin1Id,
        },
      });
      console.log(`  Updated member password: ${email}`);
      usersSkipped += 1;
      continue;
    }

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: UserRole.member,
        organizationId,
        isActive: true,
        createdById: admin1Id,
      },
    });
    console.log(`  Created member: ${email} (created by admin1)`);
    usersCreated += 1;
  }

  return { usersCreated, usersSkipped };
}

async function seedAcmeBulkCustomers(organizationId: string) {
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true, email: true },
    orderBy: { email: 'asc' },
  });

  const userIds = users.map(u => u.id);
  if (userIds.length === 0) {
    console.warn('  No Acme users; skip bulk customers.');
    return { customersCreated: 0, customersSkipped: 0, notesCreated: 0 };
  }

  const activeCounts = new Map<string, number>();
  let customersCreated = 0;
  let customersSkipped = 0;
  let notesCreated = 0;

  let rr = 0;

  const fallbackAuthorId = userIds[0];

  for (let i = 1; i <= ACME_ACTIVE_CUSTOMERS; i++) {
    const email = `bulk-active-${i}@acme.seed`.toLowerCase();
    const existing = await prisma.customer.findUnique({
      where: {
        organizationId_email: { organizationId, email },
      },
      select: { id: true },
    });
    if (existing) {
      customersSkipped += 1;
      continue;
    }

    const pick = pickAssignee(userIds, activeCounts, rr);
    let assignedToId: string | null = null;
    if (pick) {
      rr = pick.nextStart;
      activeCounts.set(
        pick.userId,
        (activeCounts.get(pick.userId) ?? 0) + 1,
      );
      assignedToId = pick.userId;
    }

    const customer = await prisma.customer.create({
      data: {
        name: `Active Customer ${i}`,
        email,
        phone: i % 7 === 0 ? `+1-555-${String(1000 + i).slice(-4)}` : null,
        organizationId,
        assignedToId,
        deletedAt: null,
      },
      select: { id: true, assignedToId: true },
    });
    customersCreated += 1;

    if (i <= 120) {
      const noteAuthor = customer.assignedToId ?? fallbackAuthorId;
      await prisma.note.create({
        data: {
          body: `Seed note for active customer ${i}.`,
          customerId: customer.id,
          organizationId,
          createdById: noteAuthor,
        },
      });
      notesCreated += 1;
      if (i % 4 === 0) {
        const other = users[(i + 3) % users.length];
        await prisma.note.create({
          data: {
            body: `Cross-team note on customer ${i}.`,
            customerId: customer.id,
            organizationId,
            createdById: other.id,
          },
        });
        notesCreated += 1;
      }
    }
  }

  for (let i = 1; i <= ACME_SOFT_DELETED_CUSTOMERS; i++) {
    const email = `bulk-deleted-${i}@acme.seed`.toLowerCase();
    const existing = await prisma.customer.findUnique({
      where: {
        organizationId_email: { organizationId, email },
      },
      select: { id: true },
    });
    if (existing) {
      customersSkipped += 1;
      continue;
    }

    const assigneeId = userIds[i % userIds.length];
    const customer = await prisma.customer.create({
      data: {
        name: `Archived Customer ${i}`,
        email,
        phone: null,
        organizationId,
        assignedToId: assigneeId,
        deletedAt: new Date(
          Date.now() - (i % 120) * 86_400_000,
        ),
      },
      select: { id: true },
    });
    customersCreated += 1;

    if (i <= 40) {
      await prisma.note.create({
        data: {
          body: `Soft-deleted seed row ${i}; used for restore/list testing.`,
          customerId: customer.id,
          organizationId,
          createdById: assigneeId,
        },
      });
      notesCreated += 1;
    }
  }

  console.log(
    `  Acme bulk: +${customersCreated} customer row(s), skipped existing ${customersSkipped}, +${notesCreated} notes.`,
  );

  return { customersCreated, customersSkipped, notesCreated };
}

async function seedOtherOrgsLight(
  hashedPassword: string,
) {
  for (const block of OTHER_ORGS) {
    let organization = await prisma.organization.findFirst({
      where: { name: block.orgName },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: { name: block.orgName },
      });
      console.log(`Created organization "${block.orgName}"`);
    }

    const adminEmail = block.admin.email.toLowerCase();
    let adminRow = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (!adminRow) {
      adminRow = await prisma.user.create({
        data: {
          email: adminEmail,
          name: block.admin.name,
          password: hashedPassword,
          role: UserRole.admin,
          organizationId: organization.id,
          isActive: true,
        },
        select: { id: true },
      });
      console.log(`  Created admin: ${adminEmail} → ${block.orgName}`);
    } else {
      await prisma.user.update({
        where: { id: adminRow.id },
        data: {
          name: block.admin.name,
          password: hashedPassword,
          role: UserRole.admin,
          organizationId: organization.id,
          isActive: true,
        },
      });
      console.log(`  Updated admin password: ${adminEmail} → ${block.orgName}`);
    }

    const memEmail = block.member.email.toLowerCase();
    const memExisting = await prisma.user.findUnique({
      where: { email: memEmail },
      select: { id: true },
    });
    if (!memExisting) {
      await prisma.user.create({
        data: {
          email: memEmail,
          name: block.member.name,
          password: hashedPassword,
          role: UserRole.member,
          organizationId: organization.id,
          isActive: true,
          createdById: adminRow.id,
        },
      });
      console.log(`  Created member: ${memEmail} → ${block.orgName}`);
    } else {
      await prisma.user.update({
        where: { id: memExisting.id },
        data: {
          name: block.member.name,
          password: hashedPassword,
          role: UserRole.member,
          organizationId: organization.id,
          isActive: true,
          createdById: adminRow.id,
        },
      });
      console.log(`  Updated member password: ${memEmail} → ${block.orgName}`);
    }

    const custEmail = `demo-lead@${block.orgName.split(' ')[0].toLowerCase()}.seed`;
    const exists = await prisma.customer.findUnique({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: custEmail,
        },
      },
    });
    if (!exists) {
      const member = await prisma.user.findUnique({
        where: { email: memEmail },
        select: { id: true },
      });
      if (member) {
        const c = await prisma.customer.create({
          data: {
            name: `${block.orgName} Demo Lead`,
            email: custEmail,
            organizationId: organization.id,
            assignedToId: member.id,
          },
        });
        await prisma.note.create({
          data: {
            body: 'Starter note for multi-tenant smoke tests.',
            customerId: c.id,
            organizationId: organization.id,
            createdById: member.id,
          },
        });
        console.log(`  Created demo customer for ${block.orgName}`);
      }
    }
  }
}

async function main() {
  const defaultPassword =
    process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@123!';

  const hashedPassword = await hashPassword(defaultPassword);

  let orgsEnsured = 0;
  let usersCreated = 0;
  let usersSkipped = 0;

  let acme = await prisma.organization.findFirst({
    where: { name: ACME_ORG_NAME },
  });

  if (!acme) {
    acme = await prisma.organization.create({
      data: { name: ACME_ORG_NAME },
    });
    orgsEnsured += 1;
    console.log(`Created organization "${ACME_ORG_NAME}" (${acme.id})`);
  } else {
    console.log(`Organization exists: "${ACME_ORG_NAME}" (${acme.id})`);
  }

  const acmeUserResult = await ensureAcmeUsers(acme.id, hashedPassword);
  usersCreated += acmeUserResult.usersCreated;
  usersSkipped += acmeUserResult.usersSkipped;

  await seedAcmeBulkCustomers(acme.id);

  await seedOtherOrgsLight(hashedPassword);

  console.log(
    `\nSeed summary: ${orgsEnsured} new org(s) (Acme), +${usersCreated} user(s) created, ${usersSkipped} user(s) skipped in Acme block. Password: SEED_ADMIN_PASSWORD`,
  );
  console.log(
    `Acme logins: admin1@acme.demo … admin${ACME_ADMIN_COUNT}@acme.demo; member1@acme.demo … member${ACME_MEMBER_COUNT}@acme.demo`,
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
