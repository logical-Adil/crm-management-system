import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { TokenService } from './token.service';

@Global()
@Module({
  imports: [JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.get<string>('jwt.secret'),
      signOptions: {
        expiresIn: `${config.get<number>('jwt.accessExpirationMins', 15)}m`,
      },
    }),
  })],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
