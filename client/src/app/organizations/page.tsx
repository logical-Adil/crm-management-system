import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import { listOrganizationsRequest } from "@/lib/organizations/organizations-api";
import { getServerSession } from "@/lib/server/session";

import { OrganizationsListClient } from "./organizations-list-client";

export const metadata = {
  title: "Organizations | CRM",
  description: "Organization directory",
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
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function OrganizationsPage({ searchParams }: PageProps) {
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

  const prefetchedAt = Date.now();
  let initialData = null;
  let initialError: string | null = null;
  try {
    initialData = await listOrganizationsRequest(session.accessToken, { page, limit });
  } catch (e) {
    initialError =
      e instanceof ApiError ? e.message : "Failed to load organizations.";
  }

  return (
    <Suspense fallback={<Fallback />}>
      <OrganizationsListClient
        key={`${page}-${limit}`}
        initialData={initialData}
        initialError={initialError}
        prefetchedAt={prefetchedAt}
      />
    </Suspense>
  );
}
