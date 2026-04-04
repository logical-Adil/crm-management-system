import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const appConfigSchema = z.object({
  NODE_ENV: z.enum(['local', 'production', 'test']),
  PORT: z.coerce.number().default(5000),
  APP_NAME: z.string(),
  CORS_ORIGINS: z
    .string()
    .transform(val => val.split(',').map(origin => origin.trim())),
});

export const appConfig = registerAs('app', () => {
  const env = appConfigSchema.parse(process.env);

  return {
    appName: env.APP_NAME,
    port: env.PORT,
    corsOrigin: env.CORS_ORIGINS,
  };
});

export type AppConfig = ReturnType<typeof appConfig>;
