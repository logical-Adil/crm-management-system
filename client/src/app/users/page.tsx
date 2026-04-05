import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import { getServerSession } from "@/lib/server/session";
import { listUsersRequest } from "@/lib/users/users-api";

import { UsersListClient } from "./users-list-client";

export const metadata = {
  title: "Users | CRM",
  description: "Users in your organization",
};

const LIMIT_OPTIONS = [10, 25, 50] as const;

function UsersFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-body text-muted">Loading…</p>
    </div>
  );
}

type PageProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session?.accessToken) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/");
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
    initialData = await listUsersRequest(session.accessToken, { page, limit });
  } catch (e) {
    initialError = e instanceof ApiError ? e.message : "Failed to load users.";
  }

  return (
    <Suspense fallback={<UsersFallback />}>
      <UsersListClient
        key={`${page}-${limit}`}
        initialData={initialData}
        initialError={initialError}
        prefetchedAt={prefetchedAt}
      />
    </Suspense>
  );
}
