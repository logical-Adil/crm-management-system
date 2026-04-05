"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
