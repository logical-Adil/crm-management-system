import { apiRequest } from "@/lib/api";

export type CustomerNote = {
  id: string;
  body: string;
  customerId: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organizationId: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CustomerDetail = CustomerListItem & {
  notes: CustomerNote[];
};

export type PaginatedCustomers = {
  results: CustomerListItem[];
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type ListCustomersParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function listCustomersRequest(
  accessToken: string,
  params: ListCustomersParams = {},
): Promise<PaginatedCustomers> {
  const sp = new URLSearchParams();
  if (params.page != null && params.page > 0) sp.set("page", String(params.page));
  if (params.limit != null && params.limit > 0) sp.set("limit", String(params.limit));
  if (params.search?.trim()) sp.set("search", params.search.trim());
  const qs = sp.toString();
  return apiRequest<PaginatedCustomers>(`/customers${qs ? `?${qs}` : ""}`, {
    method: "GET",
    accessToken,
  });
}

export type CreateCustomerBody = {
  name: string;
  email: string;
  phone?: string;
};

export async function createCustomerRequest(
  accessToken: string,
  body: CreateCustomerBody,
): Promise<CustomerListItem> {
  return apiRequest<CustomerListItem>("/customers", {
    method: "POST",
    json: body,
    accessToken,
  });
}

export async function getCustomerRequest(
  accessToken: string,
  id: string,
): Promise<CustomerDetail> {
  return apiRequest<CustomerDetail>(`/customers/${encodeURIComponent(id)}`, {
    method: "GET",
    accessToken,
  });
}

export type UpdateCustomerBody = {
  name?: string;
  email?: string;
  phone?: string | null;
};

export async function updateCustomerRequest(
  accessToken: string,
  id: string,
  body: UpdateCustomerBody,
): Promise<CustomerListItem> {
  return apiRequest<CustomerListItem>(`/customers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: body,
    accessToken,
  });
}

export async function deleteCustomerRequest(
  accessToken: string,
  id: string,
): Promise<CustomerListItem> {
  return apiRequest<CustomerListItem>(`/customers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function restoreCustomerRequest(
  accessToken: string,
  id: string,
): Promise<CustomerListItem> {
  return apiRequest<CustomerListItem>(
    `/customers/${encodeURIComponent(id)}/restore`,
    {
      method: "POST",
      accessToken,
    },
  );
}

export type AssignCustomerBody = {
  assignToUserId: string;
};

export async function assignCustomerRequest(
  accessToken: string,
  id: string,
  body: AssignCustomerBody,
): Promise<CustomerListItem> {
  return apiRequest<CustomerListItem>(
    `/customers/${encodeURIComponent(id)}/assign`,
    {
      method: "PATCH",
      json: body,
      accessToken,
    },
  );
}

export type CreateNoteBody = {
  body: string;
};

export async function addCustomerNoteRequest(
  accessToken: string,
  id: string,
  body: CreateNoteBody,
): Promise<CustomerNote> {
  return apiRequest<CustomerNote>(
    `/customers/${encodeURIComponent(id)}/notes`,
    {
      method: "POST",
      json: body,
      accessToken,
    },
  );
}
