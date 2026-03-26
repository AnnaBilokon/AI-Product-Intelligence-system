"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { navItems } from "@/components/Sidebar";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div className="rounded-4xl border border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tide">
              AI Product Insights
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Navigate the dashboard from any screen size.
            </p>
          </div>
        </div>
        <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-ink text-paper"
                    : "bg-paper/70 text-ink hover:bg-paper",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
