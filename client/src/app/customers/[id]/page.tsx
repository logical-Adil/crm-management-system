import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import { getCustomerRequest } from "@/lib/customers/customers-api";
import { getServerSession } from "@/lib/server/session";

import { CustomerDetailClient } from "./customer-detail-client";

export const metadata = {
  title: "Customer | CRM",
  description: "Customer details and notes",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session?.accessToken) {
    redirect("/login");
  }

  const prefetchedAt = Date.now();
  let initialCustomer = null;
  let initialLoadError: string | null = null;
  try {
    initialCustomer = await getCustomerRequest(session.accessToken, id);
  } catch (e) {
    initialLoadError =
      e instanceof ApiError ? e.message : "Could not load customer.";
  }

  return (
    <CustomerDetailClient
      initialCustomer={initialCustomer}
      initialLoadError={initialLoadError}
      prefetchedAt={prefetchedAt}
      serverUserId={session.user.id}
      serverUserRole={session.user.role}
    />
  );
}
