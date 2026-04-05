import { apiRequest } from "@/lib/api";

/** Matches Nest `CreateUserDto` + `UserService.create` response shape. */
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
