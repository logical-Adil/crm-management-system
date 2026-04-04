import { Controller, Get, UseGuards } from '@nestjs/common';

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
  findAll() {
    return this.organizationService.findAll();
  }
}
