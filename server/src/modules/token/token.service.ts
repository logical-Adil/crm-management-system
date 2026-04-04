import { createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenType } from '@root/generated/prisma/enums';

import { jwtConfig } from '@/config';
import { JwtConfig } from '@/config/jwt.config';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfig: JwtConfig,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueTokens(userId: string) {
    const accessExpSeconds = this.jwtConfig.accessExpirationMins * 60;
    const refreshExpSeconds = this.jwtConfig.refreshExpirationDays * 24 * 60 * 60;

    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: `${accessExpSeconds}s` },
    );

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshExpSeconds);

    await this.createRefreshToken({
      userId,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return {
      access: {
        token: accessToken,
        expiry: accessExpSeconds,
      },
      refresh: {
        token: refreshToken,
        expiry: refreshExpSeconds,
      },

    };
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    await this.prisma.token.create({
      data: {
        type: TokenType.REFRESH,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findValidRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    return this.prisma.token.findFirst({
      where: {
        type: TokenType.REFRESH,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.token.updateMany({
      where: {
        type: TokenType.REFRESH,
        tokenHash,
      },
      data: { revokedAt: new Date() },
    });
  }
}
