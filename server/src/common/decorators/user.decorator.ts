import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@root/generated/prisma/client';

export interface AuthedUserPayload {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  organizationId: string;
  createdById: string | null;
  createdBy: { id: string; email: string; name: string | null } | null;
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
