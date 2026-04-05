import { apiRequest } from "@/lib/api";

export type OrganizationRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedOrganizations = {
  results: OrganizationRow[];
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type ListOrganizationsParams = {
  page?: number;
  limit?: number;
};

export async function listOrganizationsRequest(
  accessToken: string,
  params: ListOrganizationsParams = {},
): Promise<PaginatedOrganizations> {
  const sp = new URLSearchParams();
  if (params.page != null && params.page > 0) sp.set("page", String(params.page));
  if (params.limit != null && params.limit > 0) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiRequest<PaginatedOrganizations>(
    `/organizations${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      accessToken,
    },
  );
}
