import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const jwtConfigSchema = z.object({
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number().default(15),
  JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().default(30),
});

export const jwtConfig = registerAs('jwt', () => {
  const env = jwtConfigSchema.parse(process.env);

  return {
    secret: env.JWT_SECRET,
    accessExpirationMins: env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: env.JWT_REFRESH_EXPIRATION_DAYS,
  };
});

export type JwtConfig = ReturnType<typeof jwtConfig>;
