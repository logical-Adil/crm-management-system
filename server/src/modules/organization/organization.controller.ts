import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtGuard } from '@/common/guards/jwt.guard';

import { OrganizationService } from './organization.service';

/**
 * Readable by any authenticated user (admin or member).
 */
@Controller('organizations')
@UseGuards(JwtGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.organizationService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
