import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import { listCustomersRequest } from "@/lib/customers/customers-api";
import { getServerSession } from "@/lib/server/session";

import { CustomersListClient } from "./customers-list-client";

export const metadata = {
  title: "Customers | CRM",
  description: "Customers in your organization",
};

const LIMIT_OPTIONS = [10, 25, 50] as const;

function Fallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-body text-muted">Loading…</p>
    </div>
  );
}

type PageProps = {
  searchParams: Promise<{ page?: string; limit?: string; search?: string }>;
};

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session?.accessToken) {
    redirect("/login");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limitRaw = Number(sp.limit) || 10;
  const limit = LIMIT_OPTIONS.includes(limitRaw as (typeof LIMIT_OPTIONS)[number])
    ? limitRaw
    : 10;
  const search = typeof sp.search === "string" ? sp.search.trim() : "";

  const prefetchedAt = Date.now();
  let initialData = null;
  let initialError: string | null = null;
  try {
    initialData = await listCustomersRequest(session.accessToken, {
      page,
      limit,
      search: search || undefined,
    });
  } catch (e) {
    initialError =
      e instanceof ApiError ? e.message : "Failed to load customers.";
  }

  return (
    <Suspense fallback={<Fallback />}>
      <CustomersListClient
        key={`${page}-${limit}`}
        initialData={initialData}
        initialError={initialError}
        prefetchedAt={prefetchedAt}
        serverUserId={session.user.id}
      />
    </Suspense>
  );
}
