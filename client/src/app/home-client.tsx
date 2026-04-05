"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";

type HomeClientProps = {
  serverUserName?: string;
  prefetchedAt?: number;
};

export function HomeClient({
  serverUserName,
  prefetchedAt,
}: HomeClientProps = {}) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

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

  const displayName = user?.name?.trim() || serverUserName?.trim() || "there";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-title text-foreground">Welcome</h1>
      <p className="mt-2 text-body text-muted">
        Signed in as <span className="font-medium text-foreground">{displayName}</span>.
      </p>
    </div>
  );
}
