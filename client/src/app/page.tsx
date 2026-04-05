import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server/session";

import { HomeClient } from "./home-client";

export default async function Page() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <HomeClient
      serverUserName={session.user.name}
      prefetchedAt={Date.now()}
    />
  );
}
