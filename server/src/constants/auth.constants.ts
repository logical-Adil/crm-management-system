import { UserRole } from '@root/generated/prisma/client';

export const BCRYPT_SALT_ROUNDS = 12;

export const Permissions = {
  All: '*',
  ManageUsers: 'users:manage',

} as const;

export type PermissionType = typeof Permissions[keyof typeof Permissions];

export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  admin: [Permissions.ManageUsers],
  member: [],
};
