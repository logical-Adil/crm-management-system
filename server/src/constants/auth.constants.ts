import { UserRole } from '@root/generated/prisma/enums';

export const BCRYPT_SALT_ROUNDS = 12;

export const Permissions = {
  All: '*',
  ManageUsers: 'users:manage',

} as const;

export type PermissionType = typeof Permissions[keyof typeof Permissions];

export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  SUPER_ADMIN: [Permissions.All],
  ADMIN: [Permissions.ManageUsers],
  USER: [],
};
