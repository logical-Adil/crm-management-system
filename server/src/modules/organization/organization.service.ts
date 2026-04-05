import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';
import { paginate } from '@/lib/paginate';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated directory of all organizations (same shape as `paginate()` elsewhere).
   * Sorted by name ascending.
   */
  list(options: { page?: number; limit?: number }) {
    return paginate(this.prisma.organization, {
      options: {
        page: options.page,
        limit: options.limit,
        sortBy: 'name:asc',
      },
      filters: {},
    });
  }
}
