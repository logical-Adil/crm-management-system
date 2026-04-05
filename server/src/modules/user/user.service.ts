import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@root/generated/prisma/client';

import { hashPassword } from '@/common/utils/password.utils';
import { PrismaService } from '@/database/prisma.service';

import type { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    organizationId: true,
    createdById: true,
    createdBy: {
      select: { id: true, email: true, name: true },
    },
    createdAt: true,
    updatedAt: true,
  } as const;

  /** Users created by this admin in the org (exposed on `/users/me` for UI). */
  async countUsersCreatedBy(creatorId: string, organizationId: string): Promise<number> {
    return this.prisma.user.count({
      where: { createdById: creatorId, organizationId },
    });
  }

  /** New user always belongs to `organizationId`; `createdById` records which admin created them (cannot be set by client). */
  async create(
    dto: CreateUserDto,
    organizationId: string,
    createdById: string,
  ) {
    const emailLower = dto.email.toLowerCase();
    const passwordHash = await hashPassword(dto.password);

    return this.prisma.$transaction(
      async tx => {
        const existing = await tx.user.findUnique({
          where: { email: emailLower },
          select: { id: true },
        });
        if (existing) {
          throw new ConflictException('User with this email already exists');
        }

        return tx.user.create({
          data: {
            email: emailLower,
            password: passwordHash,
            name: dto.name ?? null,
            role: dto.role,
            organizationId,
            createdById,
          },
          select: this.userSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * @param organizationId If set, only returns the user when they belong to that org (multi-tenant scope).
   *                         Omit for auth/JWT load (user id from token is sufficient).
   */
  async findById(id: string, organizationId?: string) {
    const user =
      organizationId !== undefined
        ? await this.prisma.user.findFirst({
            where: { id, organizationId },
            select: this.userSelect,
          })
        : await this.prisma.user.findUnique({
            where: { id },
            select: this.userSelect,
          });

    if (!user) {
      throw new NotFoundException(
        organizationId !== undefined
          ? 'No user with this id in your organization. The id may be wrong, the user may belong to another organization, or they may already have been deleted.'
          : 'User not found',
      );
    }

    return user;
  }

  /**
   * Paginated org directory. Rows you “own” (your account or users you created) sort first,
   * then everyone else, by `createdAt` within each group.
   *
   * Implemented with Prisma only (no raw SQL) so UUID/LIMIT parameter binding stays reliable
   * across drivers.
   */
  async list(options: {
    page?: number;
    limit?: number;
    organizationId: string;
    actorId: string;
  }) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const offset = (page - 1) * limit;
    const { organizationId, actorId } = options;

    const [meta, totalRecords] = await Promise.all([
      this.prisma.user.findMany({
        where: { organizationId },
        select: { id: true, createdAt: true, createdById: true },
      }),
      this.prisma.user.count({ where: { organizationId } }),
    ]);

    const isMine = (u: { id: string; createdById: string | null }) =>
      u.id === actorId || u.createdById === actorId;

    const orderedIds = [...meta]
      .sort((a, b) => {
        const aFirst = isMine(a);
        const bFirst = isMine(b);
        if (aFirst !== bFirst) {
          return aFirst ? -1 : 1;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map(u => u.id);

    const pageIds = orderedIds.slice(offset, offset + limit);

    if (pageIds.length === 0) {
      return {
        results: [],
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 0,
      };
    }

    const rows = await this.prisma.user.findMany({
      where: { id: { in: pageIds } },
      select: this.userSelect,
    });

    const order = new Map(pageIds.map((id, index) => [id, index]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      results: rows,
      page,
      limit,
      totalRecords,
      totalPages,
    };
  }

  async update(id: string, dto: UpdateUserDto, organizationId: string) {
    await this.findById(id, organizationId);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.role !== undefined && { role: dto.role }),
      },
      select: this.userSelect,
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }
}
