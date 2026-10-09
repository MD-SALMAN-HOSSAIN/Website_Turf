"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/bookings", label: "Bookings", icon: "🗓️" },
  { href: "/admin/slots", label: "Slots", icon: "⏱️" },
  { href: "/admin/pitches", label: "Courts", icon: "🏟️" },
  { href: "/admin/cms", label: "Site settings", icon: "⚙️" },
  { href: "/admin/sheets-sync", label: "Sheets sync", icon: "📤" },
];

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface Session {
  authenticated: boolean;
  name: string;
  email: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const currentSection = NAV_ITEMS.find((item) => isActiveRoute(pathname, item.href));

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth")
      .then(async (response) => {
        if (!response.ok) throw new Error("unauthenticated");
        return response.json() as Promise<Session>;
      })
      .then((data) => {
        if (active) setSession(data);
      })
      .catch(() => {
        if (active && !isLogin) router.replace("/admin/login");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  if (isLogin) {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-charcoal">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-surface/60 px-4 py-5 backdrop-blur md:flex">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon text-charcoal">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M6 15V7.5l6 3.4L18 7.5V15l-6 3.4L6 15z" />
            </svg>
          </div>
          <span className="font-display text-base font-bold">Admin</span>
        </Link>

        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-neon text-charcoal"
                    : "text-white/60 hover:bg-surface-raised hover:text-white"
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl bg-surface-raised px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-white/80">
              {session?.name ?? "Signed in"}
            </p>
            <p className="truncate text-[11px] text-white/40">
              {session?.email ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-2 text-sm font-medium text-white/60 ring-1 ring-white/15 transition hover:text-red-300 hover:ring-red-400/40"
          >
            Sign out
          </button>
          <Link
            href="/"
            className="block rounded-xl px-3 py-2 text-center text-sm font-medium text-neon ring-1 ring-neon/30 transition hover:bg-neon/10"
          >
            Back to site
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-60">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-charcoal/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <span className="font-display text-sm font-bold">
              {currentSection?.label ?? "Admin"}
            </span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-white/50 md:flex">
            <span className="font-medium text-white/80">
              {currentSection?.label ?? "Admin"}
            </span>
            <span className="text-white/30">/</span>
            <span>Operations portal</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/15 transition hover:text-red-300 hover:ring-red-400/40 md:hidden"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}