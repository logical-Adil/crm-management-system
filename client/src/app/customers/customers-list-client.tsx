"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import { CustomerTableRow } from "@/components/customers/customer-table-row";
import { CustomersDebouncedSearch } from "@/components/customers/customers-debounced-search";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { qk } from "@/lib/query";
import { MAX_CUSTOMERS_PER_USER } from "@/lib/customers/constants";
import {
  deleteCustomerRequest,
  listCustomersRequest,
  type CustomerListItem,
  type PaginatedCustomers,
} from "@/lib/customers/customers-api";

const LIMIT_OPTIONS = [10, 25, 50] as const;

type CustomersListClientProps = {
  /** From RSC prefetch — hydrates TanStack Query without an extra client fetch when fresh. */
  initialData?: PaginatedCustomers | null;
  initialError?: string | null;
  prefetchedAt?: number;
  serverUserId?: string;
};

export function CustomersListClient({
  initialData: initialDataProp,
  initialError: initialErrorProp,
  prefetchedAt,
  serverUserId,
}: CustomersListClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, accessToken, isReady, isAuthenticated, refreshSessionUser } = useAuth();
  const uid = serverUserId ?? user?.id;

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitRaw = Number(searchParams.get("limit")) || 10;
  const limit = LIMIT_OPTIONS.includes(limitRaw as (typeof LIMIT_OPTIONS)[number])
    ? limitRaw
    : 10;
  const search = searchParams.get("search")?.trim() ?? "";

  const [pendingDelete, setPendingDelete] = useState<CustomerListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const listKey = { page, limit, search };

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: qk.customers.list(listKey),
    queryFn: () =>
      listCustomersRequest(accessToken!, {
        page,
        limit,
        search: search || undefined,
      }),
    enabled: Boolean(isReady && isAuthenticated && accessToken),
    placeholderData: keepPreviousData,
    initialData: initialDataProp ?? undefined,
    initialDataUpdatedAt: prefetchedAt,
  });

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  const setQuery = (next: { page?: number; limit?: number; search?: string }) => {
    const sp = new URLSearchParams();
    sp.set("page", String(next.page ?? page));
    sp.set("limit", String(next.limit ?? limit));
    const s = next.search !== undefined ? next.search : search;
    if (s) sp.set("search", s);
    router.push(`/customers?${sp.toString()}`);
  };

  const navigateToCustomer = useCallback(
    (id: string) => {
      router.push(`/customers/${id}`);
    },
    [router],
  );

  const requestDelete = useCallback((row: CustomerListItem) => {
    setDeleteError(null);
    setPendingDelete(row);
  }, []);

  const confirmDelete = async () => {
    if (!accessToken || !pendingDelete) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await deleteCustomerRequest(accessToken, pendingDelete.id);
      void queryClient.invalidateQueries({ queryKey: qk.customers.all });
      await refreshSessionUser();
      setPendingDelete(null);
    } catch (e) {
      if (e instanceof ApiError) {
        setDeleteError(e.message);
      } else {
        setDeleteError("Could not delete customer.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const listError = isError
    ? error instanceof ApiError
      ? error.message
      : "Failed to load customers."
    : !data
      ? initialErrorProp ?? null
      : null;

  const loading = isLoading && !data;
  const skipAuthShell = prefetchedAt != null;

  if (!skipAuthShell && !isReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Loading…</p>
      </div>
    );
  }

  if (!skipAuthShell && !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Redirecting…</p>
      </div>
    );
  }

  const start =
    data && data.totalRecords > 0 ? (data.page - 1) * data.limit + 1 : 0;
  const end = data ? Math.min(data.page * data.limit, data.totalRecords) : 0;

  const activeAssigned = user?.activeCustomersCount ?? 0;
  const atCustomerCap = activeAssigned >= MAX_CUSTOMERS_PER_USER;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title text-foreground">Customers</h1>
          <p className="mt-1 text-body text-muted">
            Organization-wide directory. You can edit, delete, or restore only customers{" "}
            <span className="font-medium text-foreground">assigned to you</span>.
          </p>
        </div>
        {atCustomerCap ? (
          <span
            className="inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-control border border-border bg-slate-100 px-4 py-2 text-body text-muted"
            title={`You already have ${MAX_CUSTOMERS_PER_USER} active customers assigned to you. Delete or reassign one to create another.`}
          >
            Create customer (limit reached)
          </span>
        ) : (
          <Link
            href="/customers/create"
            className="inline-flex shrink-0 items-center justify-center rounded-control bg-primary px-4 py-2 text-body font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
          >
            Create customer
          </Link>
        )}
      </div>

      <CustomersDebouncedSearch searchFromUrl={search} limit={limit} />

      {listError && (
        <div
          className="mt-6 rounded-control border border-danger/25 bg-red-50 px-4 py-3 text-small text-red-800"
          role="alert"
        >
          {listError}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-border bg-slate-50/80">
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Name
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Email
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Phone
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Assignee
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Updated
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-small font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : data && data.results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    No customers match.
                  </td>
                </tr>
              ) : (
                data?.results.map(row => (
                  <CustomerTableRow
                    key={row.id}
                    row={row}
                    mine={uid != null && row.assignedToId === uid}
                    onNavigate={navigateToCustomer}
                    onRequestDelete={requestDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 0 && (
          <div className="flex flex-col gap-4 border-t border-border bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted">
              Showing{" "}
              <span className="font-medium text-foreground">
                {start}–{end}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{data.totalRecords}</span> · Page{" "}
              {data.page} of {data.totalPages}
              {isFetching && !loading ? (
                <span className="ml-2 text-muted">· Updating…</span>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-small text-muted">
                Rows
                <select
                  value={limit}
                  onChange={e => {
                    const next = Number(e.target.value);
                    setQuery({ page: 1, limit: next });
                  }}
                  className="rounded-control border border-border bg-background px-2 py-1.5 text-body text-foreground"
                >
                  {LIMIT_OPTIONS.map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setQuery({ page: page - 1 })}
                  className="rounded-control border border-border bg-background px-3 py-1.5 text-small font-medium text-foreground transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= data.totalPages || isFetching}
                  onClick={() => setQuery({ page: page + 1 })}
                  className="rounded-control border border-border bg-background px-3 py-1.5 text-small font-medium text-foreground transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!pendingDelete}
        title="Delete customer?"
        description={
          pendingDelete ? (
            <>
              Soft-delete{" "}
              <span className="font-medium text-foreground">{pendingDelete.name}</span>? You can
              restore them later from the customer page if you are still the assignee.
            </>
          ) : null
        }
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => !deleteLoading && setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
