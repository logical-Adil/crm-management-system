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
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/constants/auth.constants';

import { CreateUserDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@User() user: AuthedUserPayload) {
    return this.userService.findById(user.id);
  }

  @Post()
  @RequirePermissions(Permissions.ManageUsers)
  create(@User() authed: AuthedUserPayload, @Body() dto: CreateUserDto) {
    return this.userService.create(dto, authed.organizationId);
  }

  @Get()
  @RequirePermissions(Permissions.ManageUsers)
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.userService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':userId')
  @RequirePermissions(Permissions.ManageUsers)
  findById(@Param('userId') userId: string) {
    return this.userService.findById(userId);
  }

  @Patch(':userId')
  @RequirePermissions(Permissions.ManageUsers)
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(userId, dto);
  }

  @Delete(':userId')
  @RequirePermissions(Permissions.ManageUsers)
  async remove(@Param('userId') userId: string) {
    return this.userService.delete(userId);
  }
}
