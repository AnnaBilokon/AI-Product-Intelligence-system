import { ReactNode } from "react";

export function DashboardCard({
  title,
  value,
  detail,
  accent,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  accent: string;
  icon?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-4xl border border-slate-200/80 bg-white/95 p-6 shadow-soft">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        {icon ? (
          <div className="rounded-2xl bg-mist px-3 py-2 text-ink">{icon}</div>
        ) : null}
      </div>
    </div>
  );
}
