export function InsightCard({
  title,
  subtitle,
  content,
}: {
  title: string;
  subtitle?: string;
  content: string;
}) {
  return (
    <article className="rounded-4xl border border-white/60 bg-white/90 p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {subtitle ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
      ) : null}
      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {content}
      </div>
    </article>
  );
}
