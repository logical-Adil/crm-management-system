import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server/session";

import { EditUserClient } from "./edit-user-client";

export const metadata = {
  title: "Edit user | CRM",
  description: "View and edit a user in your organization",
};

export default async function EditUserPage() {
  const session = await getServerSession();
  if (!session?.accessToken) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return <EditUserClient />;
}
