import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthedUserPayload } from '@/common/decorators/user.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtGuard } from '@/common/guards/jwt.guard';

import { CustomerService } from './customer.service';
import {
  AssignCustomerDto,
  CreateCustomerDto,
  CreateNoteDto,
  UpdateCustomerDto,
} from './dto';

/**
 * List + GET `:id` are **organization-wide** (any authenticated member). **`POST :id/notes`** to add a note.
 * Customer mutations (create, update, delete, restore, assign) apply only when **assigned to you** (`assignedToId`).
 * Max 5 active customers assigned to you; at cap, new creates are unassigned (`assignedToId` null). Assign / restore still enforce the cap.
 */
@Controller('customers')
@UseGuards(JwtGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  list(
    @User() authed: AuthedUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.customerService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      organizationId: authed.organizationId,
      prioritizeUserId: authed.id,
    });
  }

  @Post()
  create(@User() authed: AuthedUserPayload, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(
      dto,
      authed.organizationId,
      authed.id,
    );
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @User() authed: AuthedUserPayload) {
    return this.customerService.restore(
      id,
      authed.organizationId,
      authed.id,
    );
  }

  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @User() authed: AuthedUserPayload,
    @Body() dto: AssignCustomerDto,
  ) {
    return this.customerService.assign(
      id,
      dto,
      authed.organizationId,
      authed.id,
    );
  }

  @Post(':id/notes')
  createNote(
    @Param('id') id: string,
    @User() authed: AuthedUserPayload,
    @Body() dto: CreateNoteDto,
  ) {
    return this.customerService.createNoteForCustomer(
      id,
      authed.organizationId,
      authed.id,
      dto,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() authed: AuthedUserPayload) {
    return this.customerService.findOneInOrganization(id, authed.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @User() authed: AuthedUserPayload,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(
      id,
      dto,
      authed.organizationId,
      authed.id,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() authed: AuthedUserPayload) {
    return this.customerService.softDelete(
      id,
      authed.organizationId,
      authed.id,
    );
  }
}
