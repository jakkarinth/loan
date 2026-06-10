"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogIn,
  PlusCircle,
  ScrollText,
  Users
} from "lucide-react";
import { redirectToLogin } from "@/lib/api";
import { cx } from "@/lib/format";

const navItems = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/loans", label: "รายการเงินยืม", icon: FileText },
  { href: "/loans/new", label: "บันทึกขอยืม", icon: PlusCircle },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/notices", label: "หนังสือทวง", icon: ScrollText },
  { href: "/users", label: "สมาชิก", icon: Users }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userName = [
    session?.user?.firstNameTh,
    session?.user?.lastNameTh
  ].filter(Boolean).join(" ") || session?.user?.name || session?.user?.email || "";

  useEffect(() => {
    if (status === "unauthenticated") {
      redirectToLogin();
    }
  }, [status]);

  function logout() {
    signOut({ callbackUrl: "/login" });
  }

  if (status !== "authenticated") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-sm text-slate-500">
        กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            RMUTI Surin
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-950">
            ระบบบริหารลูกหนี้เงินยืม
          </h1>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  active
                    ? "bg-brand text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-end px-4 sm:px-6 lg:px-8">
            <div className="hidden items-center gap-2 sm:flex">
              {userName ? (
                <span className="max-w-64 truncate text-sm font-medium text-slate-700">
                  {userName}
                </span>
              ) : null}
              <button
                onClick={logout}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogIn size={16} aria-hidden="true" />
                ออกจากระบบ
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "shrink-0 rounded-md px-3 py-2 text-xs font-medium",
                    active ? "bg-brand text-white" : "bg-slate-100 text-slate-700"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="shrink-0 rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
            >
              {userName ? `${userName} / ออกจากระบบ` : "ออกจากระบบ"}
            </button>
          </nav>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
