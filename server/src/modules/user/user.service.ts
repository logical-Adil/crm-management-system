import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { hashPassword } from '@/common/utils/password.utils';
import { PrismaService } from '@/database/prisma.service';
import { paginate } from '@/lib/paginate';

import type { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    organizationId: true,
    createdById: true,
    createdBy: {
      select: { id: true, email: true, name: true },
    },
    createdAt: true,
    updatedAt: true,
  } as const;

  /** New user always belongs to `organizationId`; `createdById` records which admin created them (cannot be set by client). */
  async create(
    dto: CreateUserDto,
    organizationId: string,
    createdById: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: passwordHash,
        name: dto.name ?? null,
        role: dto.role,
        organizationId,
        createdById,
      },
      select: this.userSelect,
    });

    return user;
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

  /** Only users in the given organization (not other tenants). */
  async list(options: {
    page?: number;
    limit?: number;
    organizationId: string;
  }) {
    return paginate(this.prisma.user, {
      options: {
        page: options.page,
        limit: options.limit,
      },
      filters: { organizationId: options.organizationId },
      omit: ['password'],
    });
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
