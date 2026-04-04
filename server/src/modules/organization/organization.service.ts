import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
