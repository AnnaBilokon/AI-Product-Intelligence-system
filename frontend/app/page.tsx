"use client";

import { useEffect, useState } from "react";
import { Database, Gauge, Layers3, Users } from "lucide-react";

import { DashboardCard } from "@/components/DashboardCard";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatusIndicator } from "@/components/StatusIndicator";
import { getHealth, getStats } from "@/lib/api";
import { loadInsightSnapshots, loadUploadHistory } from "@/lib/storage";
import type { HealthResponse, StatsResponse } from "@/lib/types";

export default function HomePage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [uploads, setUploads] = useState(
    () => [] as ReturnType<typeof loadUploadHistory>,
  );
  const [snapshots, setSnapshots] = useState(
    () => [] as ReturnType<typeof loadInsightSnapshots>,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUploads(loadUploadHistory());
    setSnapshots(loadInsightSnapshots());

    async function loadDashboard() {
      try {
        const [statsData, healthData] = await Promise.all([
          getStats(),
          getHealth(),
        ]);
        setStats(statsData);
        setHealth(healthData);
      } catch (dashboardError) {
        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Unable to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  return (
    <>
      <Header
        eyebrow="Overview"
        title="A command center for customer signal"
        description="Track ingestion volume, vector coverage, and recent analysis activity across your product feedback pipeline."
        action={
          <StatusIndicator
            status={
              error
                ? "offline"
                : health?.status === "ok"
                  ? "healthy"
                  : "warning"
            }
            label={
              error
                ? "Backend unavailable"
                : health?.openai_configured
                  ? "API and OpenAI ready"
                  : "API ready, OpenAI missing"
            }
          />
        }
      />

      {loading ? (
        <LoadingSpinner label="Loading dashboard metrics" />
      ) : error ? (
        <EmptyState title="Backend not reachable" description={error} />
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Feedback Entries"
              value={stats?.total_feedback_entries || 0}
              detail="Unique feedback records stored in the vector-backed knowledge base."
              accent="linear-gradient(90deg, #c65f3d, #f0ad8a)"
              icon={<Gauge className="h-5 w-5" />}
            />
            <DashboardCard
              title="Stored Chunks"
              value={stats?.total_chunks || 0}
              detail="Token-aware feedback chunks available for semantic retrieval and reporting."
              accent="linear-gradient(90deg, #2f6c7a, #8bc1cb)"
              icon={<Layers3 className="h-5 w-5" />}
            />
            <DashboardCard
              title="Tracked Customers"
              value={stats?.customers.length || 0}
              detail="Distinct customer accounts currently represented in the local vector store."
              accent="linear-gradient(90deg, #5e7b57, #a3c091)"
              icon={<Users className="h-5 w-5" />}
            />
            <DashboardCard
              title="Collection"
              value={stats?.collection_name || "n/a"}
              detail="Active Chroma collection name used by the FastAPI backend."
              accent="linear-gradient(90deg, #10232d, #5b7380)"
              icon={<Database className="h-5 w-5" />}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-panel">
              <h2 className="text-xl font-semibold text-ink">
                Coverage snapshot
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-paper/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Customers
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stats?.customers.length ? (
                      stats.customers.map((customer) => (
                        <span
                          key={customer}
                          className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"
                        >
                          {customer}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600">
                        No customer names stored yet.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-3xl bg-paper/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Sources
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stats?.sources.length ? (
                      stats.sources.map((source) => (
                        <span
                          key={source}
                          className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"
                        >
                          {source}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600">
                        No source labels stored yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-panel">
              <h2 className="text-xl font-semibold text-ink">Local activity</h2>
              <div className="mt-6 space-y-5 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-ink">Recent uploads</p>
                  {uploads.length ? (
                    <div className="mt-3 space-y-3">
                      {uploads.slice(0, 3).map((upload) => (
                        <div
                          key={upload.id}
                          className="rounded-2xl bg-paper/70 p-3"
                        >
                          <p className="font-medium text-ink">
                            {upload.customer || "Unnamed customer"}
                          </p>
                          <p className="mt-1">
                            {upload.ingestedEntries} entries |{" "}
                            {upload.ingestedChunks} chunks
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2">No local upload history yet.</p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-ink">Recent analyses</p>
                  {snapshots.length ? (
                    <div className="mt-3 space-y-3">
                      {snapshots.slice(0, 3).map((snapshot) => (
                        <div
                          key={snapshot.id}
                          className="rounded-2xl bg-paper/70 p-3"
                        >
                          <p className="font-medium text-ink">
                            {snapshot.query}
                          </p>
                          <p className="mt-1">
                            {snapshot.contextCount} context chunks
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2">No saved insight snapshots yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
