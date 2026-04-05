import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server/session";

import { CreateCustomerClient } from "./create-customer-client";

export const metadata = {
  title: "Create customer | CRM",
  description: "Create a customer assigned to you",
};

export default async function CreateCustomerPage() {
  const session = await getServerSession();
  if (!session?.accessToken) {
    redirect("/login");
  }
  return <CreateCustomerClient />;
}
