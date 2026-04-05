"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth";

const linkBase =
  "block rounded-control px-3 py-2 text-body transition-colors";
const linkIdle = "text-muted hover:bg-slate-50 hover:text-foreground";
const linkActive = "bg-primary/10 font-medium text-primary";

/**
 * Left navigation — shared for all authenticated routes. Admin-only items use `user.role`.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  /** Avoid highlighting both `/users` and `/users/create` when paths share a prefix. */
  const nav = (href: string) => {
    const active = (() => {
      if (href === "/") return pathname === "/";
      if (href === "/organizations") return pathname === "/organizations";
      if (href === "/customers") {
        if (pathname === "/customers") return true;
        if (pathname.startsWith("/customers/create")) return false;
        return /^\/customers\/[^/]+$/.test(pathname);
      }
      if (href === "/users") {
        if (pathname === "/users") return true;
        if (pathname === "/users/create") return false;
        return /^\/users\/[^/]+$/.test(pathname);
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    })();
    return active ? `${linkBase} ${linkActive}` : `${linkBase} ${linkIdle}`;
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
      <nav className="flex flex-col gap-0.5 p-3" aria-label="Main">
        <Link href="/" className={nav("/")}>
          Home
        </Link>
        <Link href="/organizations" className={nav("/organizations")}>
          Organizations
        </Link>
        <Link href="/customers" className={nav("/customers")}>
          Customers
        </Link>
        {isAdmin ? (
          <>
            <Link href="/users" className={nav("/users")}>
              Users
            </Link>
            <Link href="/users/create" className={nav("/users/create")}>
              Create user
            </Link>
          </>
        ) : null}
      </nav>
    </aside>
  );
}
