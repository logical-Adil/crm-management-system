"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { OrganizationTableRow } from "@/components/organizations/organization-table-row";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { qk } from "@/lib/query";
import {
  listOrganizationsRequest,
  type PaginatedOrganizations,
} from "@/lib/organizations/organizations-api";

const LIMIT_OPTIONS = [10, 25, 50] as const;

type OrganizationsListClientProps = {
  initialData?: PaginatedOrganizations | null;
  initialError?: string | null;
  prefetchedAt?: number;
};

export function OrganizationsListClient({
  initialData: initialDataProp,
  initialError: initialErrorProp,
  prefetchedAt,
}: OrganizationsListClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isReady, isAuthenticated } = useAuth();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitRaw = Number(searchParams.get("limit")) || 10;
  const limit = LIMIT_OPTIONS.includes(limitRaw as (typeof LIMIT_OPTIONS)[number])
    ? limitRaw
    : 10;

  const listKey = { page, limit };

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: qk.organizations.list(listKey),
    queryFn: () => listOrganizationsRequest(accessToken!, { page, limit }),
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

  const setQuery = (nextPage: number, nextLimit: number) => {
    const sp = new URLSearchParams();
    sp.set("page", String(nextPage));
    sp.set("limit", String(nextLimit));
    router.push(`/organizations?${sp.toString()}`);
  };

  const listError = isError
    ? error instanceof ApiError
      ? error.message
      : "Failed to load organizations."
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

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-title text-foreground">Organizations</h1>
        <p className="mt-1 text-body text-muted">
          Directory (view only) — paginated from{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-small">
            GET /organizations
          </code>
          .
        </p>
      </div>

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
          <table className="w-full min-w-[560px] border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-border bg-slate-50/80">
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Name
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Created
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-small font-semibold uppercase tracking-wide text-muted">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : data && data.results.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-muted">
                    No organizations.
                  </td>
                </tr>
              ) : (
                data?.results.map(row => (
                  <OrganizationTableRow key={row.id} row={row} />
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
                    setQuery(1, next);
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
                  onClick={() => setQuery(page - 1, limit)}
                  className="rounded-control border border-border bg-background px-3 py-1.5 text-small font-medium text-foreground transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= data.totalPages || isFetching}
                  onClick={() => setQuery(page + 1, limit)}
                  className="rounded-control border border-border bg-background px-3 py-1.5 text-small font-medium text-foreground transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
