import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, Prisma } from '@root/generated/prisma/client';

import { MAX_CUSTOMERS_PER_USER } from '@/constants/customer.constants';
import { PrismaService } from '@/database/prisma.service';

import type {
  AssignCustomerDto,
  CreateCustomerDto,
  CreateNoteDto,
  UpdateCustomerDto,
} from './dto';

const customerListSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  organizationId: true,
  assignedToId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

const noteSelect = {
  id: true,
  body: true,
  customerId: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CustomerListSqlRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organizationId: string;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) { }

  /** Append-only audit row; `entityId` is always the customer UUID for these actions. */
  private async logCustomerActivity(
    tx: Prisma.TransactionClient,
    organizationId: string,
    customerId: string,
    action:
      | typeof ActivityAction.CUSTOMER_CREATED
      | typeof ActivityAction.CUSTOMER_UPDATED
      | typeof ActivityAction.CUSTOMER_DELETED
      | typeof ActivityAction.CUSTOMER_RESTORED
      | typeof ActivityAction.NOTE_ADDED
      | typeof ActivityAction.CUSTOMER_ASSIGNED,
    performedById: string,
  ) {
    await tx.activityLog.create({
      data: {
        organizationId,
        entityType: 'customer',
        entityId: customerId,
        action,
        performedById, // UserID
      },
    });
  }

  private activeCountWhere(organizationId: string, assignedToId: string) {
    return {
      organizationId,
      assignedToId,
      deletedAt: null,
    } satisfies Prisma.CustomerWhereInput;
  }

  /** Active (non-deleted) customers assigned to this user in the org — for caps and `/users/me`. */
  async countActiveForAssignee(
    organizationId: string,
    assigneeId: string,
  ): Promise<number> {
    return this.prisma.customer.count({
      where: this.activeCountWhere(organizationId, assigneeId),
    });
  }

  /**
   * Paginated list of all **active** customers in the organization (any member can browse).
   * Rows assigned to `prioritizeUserId` are ordered first, then everyone else (by `updatedAt` desc).
   * Uses `CASE` so unassigned rows (`assigned_to_id` NULL) are not ordered ambiguously — unlike `(col = id) DESC`, where `NULL = id` is unknown in SQL.
   */
  async list(options: {
    page?: number;
    limit?: number;
    search?: string;
    organizationId: string;
    prioritizeUserId: string;
  }) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const skip = (page - 1) * limit;

    const search = options.search?.trim();
    const { organizationId, prioritizeUserId } = options;

    const where: Prisma.CustomerWhereInput = {
      organizationId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const searchFilter = search
      ? Prisma.sql`AND (
          name ILIKE ${`%${search}%`}
          OR email ILIKE ${`%${search}%`}
        )`
      : Prisma.empty;

    const [rows, totalRecords] = await Promise.all([
      this.prisma.$queryRaw<CustomerListSqlRow[]>(Prisma.sql`
        SELECT
          id,
          name,
          email,
          phone,
          organization_id AS "organizationId",
          assigned_to_id AS "assignedToId",
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          deleted_at AS "deletedAt"
        FROM customers
        WHERE organization_id = ${organizationId}
          AND deleted_at IS NULL
          ${searchFilter}
        ORDER BY
          CASE WHEN assigned_to_id = ${prioritizeUserId} THEN 0 ELSE 1 END ASC,
          updated_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `),
      this.prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 0;

    return {
      results: rows,
      page,
      limit,
      totalRecords,
      totalPages,
    };
  }

  async create(
    dto: CreateCustomerDto,
    organizationId: string,
    assignedToId: string,
  ) {
    const email = dto.email.toLowerCase();

    return this.prisma.$transaction(
      async (tx) => {
        const activeAssignedToMe = await tx.customer.count({
          where: this.activeCountWhere(organizationId, assignedToId),
        });
        /** At cap, create as unassigned (same idea as seed overflow) instead of blocking creation. */
        const assigneeId
          = activeAssignedToMe >= MAX_CUSTOMERS_PER_USER ? null : assignedToId;

        try {
          const created = await tx.customer.create({
            data: {
              name: dto.name,
              email,
              phone: dto.phone ?? null,
              organizationId,
              assignedToId: assigneeId,
            },
            select: customerListSelect,
          });

          await this.logCustomerActivity(
            tx,
            organizationId,
            created.id,
            ActivityAction.CUSTOMER_CREATED,
            assignedToId,
          );

          return created;
        } catch (e: unknown) {
          if (
            typeof e === 'object'
            && e !== null
            && 'code' in e
            && (e as { code: string }).code === 'P2002'
          ) {
            throw new ConflictException(
              'A customer with this email already exists in your organization.',
            );
          }
          throw e;
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /** Detail + notes for any customer in the org (including soft-deleted). Any authenticated org member may view. */
  async findOneInOrganization(id: string, organizationId: string) {
    const row = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          select: noteSelect,
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Customer not found in your organization.');
    }

    const { notes, ...customer } = row;
    return {
      ...customer,
      notes,
    };
  }

  /** Create a note on a customer; any org member may add (same visibility rules as reading the customer). */
  async createNoteForCustomer(
    customerId: string,
    organizationId: string,
    createdById: string,
    dto: CreateNoteDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
      },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found in your organization.');
    }

    return this.prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          body: dto.body,
          customerId,
          organizationId,
          createdById,
        },
        select: noteSelect,
      });

      await this.logCustomerActivity(
        tx,
        organizationId,
        customerId,
        ActivityAction.NOTE_ADDED,
        createdById,
      );

      return note;
    });
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    organizationId: string,
    assignedToId: string,
  ) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
        assignedToId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(
        'Customer not found, not assigned to you, or no longer active.',
      );
    }

    const email = dto.email !== undefined ? dto.email.toLowerCase() : undefined;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.customer.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(email !== undefined && { email }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
          },
          select: customerListSelect,
        });
        await this.logCustomerActivity(
          tx,
          organizationId,
          id,
          ActivityAction.CUSTOMER_UPDATED,
          assignedToId,
        );
        return updated;
      });
    } catch (e: unknown) {
      if (
        typeof e === 'object'
        && e !== null
        && 'code' in e
        && (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'A customer with this email already exists in your organization.',
        );
      }
      throw e;
    }
  }

  async softDelete(
    id: string,
    organizationId: string,
    assignedToId: string,
  ) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
        assignedToId,
      },
      select: { id: true, deletedAt: true },
    });
    if (!existing) {
      throw new NotFoundException(
        'Customer not found, not assigned to you, or no longer active.',
      );
    }
    if (existing.deletedAt != null) {
      throw new BadRequestException(
        'This customer has already been deleted.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: customerListSelect,
      });
      await this.logCustomerActivity(
        tx,
        organizationId,
        id,
        ActivityAction.CUSTOMER_DELETED,
        assignedToId,
      );
      return updated;
    });
  }

  async restore(
    id: string,
    organizationId: string,
    assignedToId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.customer.findFirst({
          where: {
            id,
            organizationId,
            assignedToId,
            deletedAt: { not: null },
          },
          select: { id: true },
        });

        if (!existing) {
          throw new NotFoundException(
            'No soft-deleted customer with this id assigned to you.',
          );
        }

        const activeCount = await tx.customer.count({
          where: this.activeCountWhere(organizationId, assignedToId),
        });
        if (activeCount >= MAX_CUSTOMERS_PER_USER) {
          throw new BadRequestException(
            `You already have ${MAX_CUSTOMERS_PER_USER} active customers. Delete or assign one before restoring.`,
          );
        }

        const updated = await tx.customer.update({
          where: { id },
          data: { deletedAt: null },
          select: customerListSelect,
        });

        await this.logCustomerActivity(
          tx,
          organizationId,
          id,
          ActivityAction.CUSTOMER_RESTORED,
          assignedToId,
        );

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async assign(
    id: string,
    dto: AssignCustomerDto,
    organizationId: string,
    currentAssigneeId: string,
  ) {
    const targetId = dto.assignToUserId;

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetId, organizationId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException(
        'Target user not found in your organization.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const customer = await tx.customer.findFirst({
          where: {
            id,
            organizationId,
            assignedToId: currentAssigneeId,
            deletedAt: null,
          },
          select: { id: true, assignedToId: true },
        });

        if (!customer) {
          throw new NotFoundException(
            'Active customer not found or not assigned to you.',
          );
        }

        if (customer.assignedToId === targetId) {
          const unchanged = await tx.customer.findFirstOrThrow({
            where: { id },
            select: customerListSelect,
          });
          return unchanged;
        }

        const targetCount = await tx.customer.count({
          where: this.activeCountWhere(organizationId, targetId),
        });
        if (targetCount >= MAX_CUSTOMERS_PER_USER) {
          throw new BadRequestException(
            `That user already has the maximum of ${MAX_CUSTOMERS_PER_USER} active customers.`,
          );
        }

        const updated = await tx.customer.update({
          where: { id },
          data: { assignedToId: targetId },
          select: customerListSelect,
        });

        await this.logCustomerActivity(
          tx,
          organizationId,
          id,
          ActivityAction.CUSTOMER_ASSIGNED,
          currentAssigneeId,
        );

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
