import { apiRequest } from "@/lib/api";

import type { AuthUser } from "@/lib/auth/types";

export type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  organizationId: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; email: string; name: string | null } | null;
};

export async function fetchCurrentUserRequest(accessToken: string): Promise<MeResponse> {
  return apiRequest<MeResponse>("/users/me", {
    method: "GET",
    accessToken,
  });
}

export function meResponseToAuthUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    email: me.email,
    name: me.name ?? "",
    role: me.role,
    isActive: me.isActive,
    organizationId: me.organizationId,
    createdById: me.createdById,
  };
}

export type CreateUserBody = {
  email: string;
  password: string;
  name?: string;
  role: "admin" | "member";
};

export type CreatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  organizationId: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function createUserRequest(
  accessToken: string,
  body: CreateUserBody,
): Promise<CreatedUser> {
  return apiRequest<CreatedUser>("/users", {
    method: "POST",
    json: body,
    accessToken,
  });
}

export type UserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  organizationId: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; email: string; name: string | null } | null;
};

export type PaginatedUsers = {
  results: UserListItem[];
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type ListUsersParams = {
  page?: number;
  limit?: number;
};

export async function listUsersRequest(
  accessToken: string,
  params: ListUsersParams = {},
): Promise<PaginatedUsers> {
  const sp = new URLSearchParams();
  if (params.page != null && params.page > 0) sp.set("page", String(params.page));
  if (params.limit != null && params.limit > 0) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiRequest<PaginatedUsers>(`/users${qs ? `?${qs}` : ""}`, {
    method: "GET",
    accessToken,
  });
}

export type UserDetail = UserListItem;

export async function getUserByIdRequest(
  accessToken: string,
  id: string,
): Promise<UserDetail> {
  return apiRequest<UserDetail>(`/users/${encodeURIComponent(id)}`, {
    method: "GET",
    accessToken,
  });
}

export type UpdateUserBody = {
  name?: string;
  role?: "admin" | "member";
};

export async function updateUserRequest(
  accessToken: string,
  id: string,
  body: UpdateUserBody,
): Promise<UserDetail> {
  return apiRequest<UserDetail>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: body,
    accessToken,
  });
}

export type DeleteUserResponse = {
  code: number;
  success: boolean;
  message: string;
  timestamp: string;
  data: UserDetail;
};

export async function deleteUserRequest(
  accessToken: string,
  id: string,
): Promise<DeleteUserResponse> {
  return apiRequest<DeleteUserResponse>(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
}
