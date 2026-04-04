import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { comparePassword } from '@/common/utils/password.utils';
import { TokenService } from '@/modules/token/token.service';
import { UserService } from '@/modules/user/user.service';

import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await comparePassword(
      dto.password,
      user.password,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.tokenService.issueTokens(user.id);
    await this.userService.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      tokens,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async refresh(refreshToken: string) {
    const record = await this.tokenService.findValidRefreshToken(refreshToken);
    if (!record) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.tokenService.revokeRefreshToken(refreshToken);
    return this.tokenService.issueTokens(record.userId);
  }
}
