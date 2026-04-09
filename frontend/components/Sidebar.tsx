"use client";

import clsx from "clsx";
import { BarChart3, FileText, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/feedback", label: "Feedback", icon: FileText },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/customers", label: "Companies", icon: Users },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen flex-col justify-between rounded-r-4xl border-r border-white/40 bg-ink px-6 py-8 text-paper shadow-panel">
      <div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/60">
            AI Product Insights
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Signal into strategy
          </h2>
          <p className="mt-3 text-sm leading-6 text-paper/70">
            Turn raw customer feedback into product direction, account context,
            and sharper prioritization.
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-paper text-ink"
                    : "text-paper/72 hover:bg-white/8 hover:text-paper",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-3xl border border-ember/20 bg-ember/10 p-4 text-sm leading-6 text-paper/80">
        The frontend is loosely coupled to the FastAPI API through a reusable
        client in `lib/api.ts`.
      </div>
    </aside>
  );
}
