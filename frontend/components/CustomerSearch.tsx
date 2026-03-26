"use client";

export function CustomerSearch({
  value,
  onChange,
  onSearch,
  loading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-panel">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink">
          Customer name
        </span>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Acme"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={loading}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Generate report"}
          </button>
        </div>
      </label>
    </div>
  );
}
