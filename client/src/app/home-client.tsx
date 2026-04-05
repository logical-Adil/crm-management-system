"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";

/**
 * Authenticated home placeholder — navbar comes from {@link AppShell}.
 */
export function HomeClient() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-title text-foreground">Welcome</h1>
      <p className="mt-2 text-body text-muted">
        Signed in as <span className="font-medium text-foreground">{user?.name}</span>.
        Build out CRM modules here — the top bar stays on every page.
      </p>
    </div>
  );
}
