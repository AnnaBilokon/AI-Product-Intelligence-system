"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { InsightCard } from "@/components/InsightCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { runAnalysis } from "@/lib/api";
import { loadInsightSnapshots, saveInsightSnapshot } from "@/lib/storage";
import type { AnalysisResponse, InsightSnapshot } from "@/lib/types";

const defaultQuery =
  "What are the biggest customer pain points, repeated requests, and product opportunities?";

export function AnalysisPanel() {
  const [query, setQuery] = useState(defaultQuery);
  const [customer, setCustomer] = useState("");
  const [source, setSource] = useState("");
  const [topK, setTopK] = useState(6);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<InsightSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadInsightSnapshots());
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await runAnalysis({
        query,
        customer: customer || undefined,
        source: source || undefined,
        top_k: topK,
      });
      setResult(response);
      setHistory(
        saveInsightSnapshot({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          query,
          customer: customer || undefined,
          source: source || undefined,
          contextCount: response.context_count,
          result: response,
        }),
      );
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr,1.35fr]">
      <section className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-paper p-3 text-ink">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Run analysis</h2>
            <p className="text-sm text-slate-600">
              Query the stored feedback and produce product-ready insight
              summaries.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">
              Question
            </span>
            <textarea
              rows={6}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-ink">
                Customer filter
              </span>
              <input
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-ink">
                Source filter
              </span>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
              />
            </label>
          </div>

          <label>
            <span className="mb-2 block text-sm font-medium text-ink">
              Context depth
            </span>
            <input
              type="range"
              min={3}
              max={12}
              value={topK}
              onChange={(event) => setTopK(Number(event.target.value))}
              className="w-full accent-ember"
            />
            <p className="mt-2 text-sm text-slate-600">
              Top {topK} retrieved chunks will be used as context.
            </p>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Running analysis..." : "Generate insights"}
          </button>
          {loading ? (
            <LoadingSpinner label="Gathering context and generating insights" />
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 p-4 text-sm text-slate-600">
          <p className="font-semibold text-ink">Recent snapshots</p>
          {history.length > 0 ? (
            <div className="mt-3 space-y-3">
              {history.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl bg-paper/60 p-3">
                  <p className="font-medium text-ink">{item.query}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {new Date(item.createdAt).toLocaleString()} |{" "}
                    {item.contextCount} chunks
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3">
              Snapshots are stored in localStorage after each successful run.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-6">
        {result ? (
          <>
            <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tide">
                Analysis Summary
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-2xl bg-paper/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Context used
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {result.context_count}
                  </p>
                </div>
                <div className="rounded-2xl bg-paper/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Customer filter
                  </p>
                  <p className="mt-2 text-base font-semibold text-ink">
                    {result.filters.customer || "All"}
                  </p>
                </div>
                <div className="rounded-2xl bg-paper/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Source filter
                  </p>
                  <p className="mt-2 text-base font-semibold text-ink">
                    {result.filters.source || "All"}
                  </p>
                </div>
              </div>
            </div>
            <InsightCard title="Pain Points" content={result.pain_points} />
            <InsightCard
              title="Feature Requests"
              content={result.feature_requests}
            />
            <InsightCard title="Themes" content={result.themes} />
            <InsightCard title="Opportunities" content={result.opportunities} />
          </>
        ) : (
          <EmptyState
            title="No insight run yet"
            description="Use the analysis panel to retrieve stored feedback chunks and generate a multi-part product intelligence summary."
          />
        )}
      </section>
    </div>
  );
}
