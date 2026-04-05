"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useAuth } from "@/lib/auth";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Full-width app bar: logo left, account menu (logout) right — used for all authenticated pages.
 */
export function AppNavbar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const label = user?.name ?? "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-[100vw] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-foreground transition-opacity hover:opacity-90"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200/80">
            <Image
              src="/logo.png"
              alt="CRM"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </span>
          <span className="text-heading font-semibold tracking-tight">CRM</span>
        </Link>

        <div className="relative flex items-center" ref={rootRef}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-small font-semibold text-slate-800 shadow-inner ring-2 ring-white ring-offset-2 ring-offset-surface transition-[box-shadow,transform] hover:ring-primary/20"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            {user ? initials(user.name) : "?"}
          </button>

          {open && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[12rem] rounded-control border border-border bg-surface py-1 shadow-lg ring-1 ring-slate-900/[0.06]"
            >
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-small font-medium text-foreground">{label}</p>
                {user?.email && (
                  <p className="truncate text-small text-muted">{user.email}</p>
                )}
              </div>
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2.5 text-left text-body text-foreground transition-colors hover:bg-slate-50"
                onClick={() => {
                  close();
                  void signOut();
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
