export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-4xl border border-white/70 bg-white/80 p-8 shadow-soft backdrop-blur">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}
