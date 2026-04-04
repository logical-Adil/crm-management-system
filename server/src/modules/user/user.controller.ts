import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthedUserPayload } from '@/common/decorators/user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/constants/auth.constants';

import { CreateUserDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';

/**
 * User routes:
 * - Org isolation: list / :id / patch / delete use the caller JWT’s `organizationId`, so admins only see and manage users in **their** company (never another org).
 * - Create: new users are stored with that same `organizationId` and `createdById` = the acting admin’s user id (audit).
 */
@Controller('users')
@UseGuards(JwtGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@User() user: AuthedUserPayload) {
    return this.userService.findById(user.id, user.organizationId);
  }

  @Post()
  @RequirePermissions(Permissions.ManageUsers)
  create(@User() authed: AuthedUserPayload, @Body() dto: CreateUserDto) {
    return this.userService.create(dto, authed.organizationId, authed.id);
  }

  @Get()
  @RequirePermissions(Permissions.ManageUsers)
  list(
    @User() authed: AuthedUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      organizationId: authed.organizationId,
    });
  }

  @Get(':id')
  @RequirePermissions(Permissions.ManageUsers)
  findById(@Param('id') id: string, @User() authed: AuthedUserPayload) {
    return this.userService.findById(id, authed.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.ManageUsers)
  update(
    @Param('id') id: string,
    @User() authed: AuthedUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto, authed.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permissions.ManageUsers)
  remove(@Param('id') id: string, @User() authed: AuthedUserPayload) {
    return this.userService.delete(id, authed.organizationId).then((deleted) => {
      const label = deleted.name?.trim() || deleted.email;
      return {
        code: HttpStatus.OK,
        success: true,
        message: `User "${label}" was deleted successfully.`,
        timestamp: new Date().toISOString(),
        data: deleted,
      };
    });
  }
}
