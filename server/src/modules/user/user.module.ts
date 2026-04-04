import { Module } from '@nestjs/common';

import { PermissionsGuard } from '@/common/guards/permissions.guard';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PermissionsGuard],
  exports: [UserService],
})
export class UserModule {}
