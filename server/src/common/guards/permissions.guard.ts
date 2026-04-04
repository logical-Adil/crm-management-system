import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@root/generated/prisma/enums';

import { Permissions, PermissionType, ROLE_PERMISSIONS } from '@/constants/auth.constants';

import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface RequestUser {
  id: string;
  role: UserRole;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionType[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user || !user.role) {
      throw new ForbiddenException('User context or role missing');
    }

    const grantedPermissions = ROLE_PERMISSIONS[user.role] || [];

    if (grantedPermissions.includes(Permissions.All)) {
      return true;
    }

    const hasPermissions = required.every(reqPerm =>
      grantedPermissions.includes(reqPerm),
    );

    if (!hasPermissions) {
      throw new ForbiddenException('Action not allowed!');
    }

    return true;
  }
}
