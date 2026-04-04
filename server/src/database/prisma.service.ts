import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@root/generated/prisma/client';

import { DatabaseConfig, databaseConfig } from '@/config/database.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly dbConfig: DatabaseConfig,
  ) {
    const adapter = new PrismaPg({
      connectionString: dbConfig.url,
    });

    super({ adapter });
  }

  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const { host, port, name } = this.dbConfig;
    try {
      await this.$connect();
      this.logger.log(`Database "${name}" connected successfully on ${host}:${port}`);
    } catch (err) {
      this.logger.error('Failed to connect to the database', (err as Error).stack);
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from the database');
    } catch (err) {
      this.logger.error('Error while disconnecting from the database', (err as Error).stack);
    }
  }
}
