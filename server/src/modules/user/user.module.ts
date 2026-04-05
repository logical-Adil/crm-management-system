import { Module } from '@nestjs/common';

import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { CustomerModule } from '@/modules/customer/customer.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [CustomerModule],
  controllers: [UserController],
  providers: [UserService, PermissionsGuard],
  exports: [UserService],
})
export class UserModule {}
