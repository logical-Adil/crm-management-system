"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth";

import { AppNavbar } from "./app-navbar";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isReady && isAuthenticated ? <AppNavbar /> : null}
      <div className="flex min-h-0 flex-1">
        {isReady && isAuthenticated ? <AppSidebar /> : null}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
