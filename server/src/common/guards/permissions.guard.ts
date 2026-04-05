import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@root/generated/prisma/client';

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
    const raw = this.reflector.getAllAndOverride<
      PermissionType[] | PermissionType | undefined
    >(REQUIRED_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const required = (Array.isArray(raw) ? raw : raw != null ? [raw] : [])
      .flat(Infinity)
      .filter((p): p is PermissionType => typeof p === 'string' && p.length > 0);

    if (required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user) {
      throw new ForbiddenException(
        'Cannot verify permissions: no authenticated user on the request.',
      );
    }

    if (user.role == null) {
      throw new ForbiddenException(
        'Cannot verify permissions: your account has no role assigned.',
      );
    }

    const grantedPermissions = ROLE_PERMISSIONS[user.role] ?? [];

    if (grantedPermissions.includes(Permissions.All)) {
      return true;
    }

    const hasPermissions = required.every(reqPerm =>
      grantedPermissions.includes(reqPerm),
    );

    if (!hasPermissions) {
      const need = required.join(', ');
      throw new ForbiddenException(
        `Missing permission: ${need}. Your role is "${String(user.role)}"; only roles that include those permissions may perform this action.`,
      );
    }

    return true;
  }
}
