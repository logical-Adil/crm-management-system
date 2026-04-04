import { Logger, LogLevel, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevels: LogLevel[] = isProduction ? ['log', 'warn', 'error'] : ['log', 'error', 'warn', 'debug', 'verbose'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: logLevels,
  });

  app.use(helmet());

  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  const port = config.get<number>('app.port');
  const allowedUrls = config.get<string[]>('app.corsOrigin');

  app.enableCors({
    origin: allowedUrls,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422, // Use 422 Unprocessable Entity for validation errors
    }),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // OPTIONAL: Uncomment to accept user's Ip for rate limit
  // app.set('trust proxy', true);

  await app.listen(port || 3000);
  logger.log(`Nest application started on port ${port || 3000}`);
}

void bootstrap();
