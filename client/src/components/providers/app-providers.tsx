"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/query";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </QueryProvider>
  );
}
