import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { UserRole } from '@root/generated/prisma/enums';

export interface AuthedUserPayload {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const User = createParamDecorator(
  (data: keyof AuthedUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthedUserPayload;
    return data ? user?.[data] : user;
  },
);
