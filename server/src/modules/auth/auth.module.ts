import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CustomerModule } from '@/modules/customer/customer.module';
import { TokenModule } from '@/modules/token/token.module';
import { UserModule } from '@/modules/user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';

@Module({
  imports: [
    UserModule,
    CustomerModule,
    TokenModule,
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy],
  exports: [AuthService],
})
export class AuthModule {}
