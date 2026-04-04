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
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(dto: CreateUserDto, organizationId: string) {
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

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async list(options?: { page?: number; limit?: number }) {
    return paginate(this.prisma.user, {
      options: {
        page: options?.page,
        limit: options?.limit,
      },

      omit: ['password'],
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: this.userSelect,
    });
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }
}
