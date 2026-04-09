"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lightbulb, ShieldAlert, Users } from "lucide-react";

import { DashboardCard } from "@/components/DashboardCard";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatusIndicator } from "@/components/StatusIndicator";
import { getOverview } from "@/lib/api";
import { loadInsightSnapshots, loadUploadHistory } from "@/lib/storage";
import type { ProductOverviewResponse } from "@/lib/types";

function RiskBadge({ risk }: { risk: "medium" | "high" }) {
  return (
    <span
      className={
        risk === "high"
          ? "inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700"
          : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700"
      }
    >
      {risk} risk
    </span>
  );
}

export default function HomePage() {
  const [overview, setOverview] = useState<ProductOverviewResponse | null>(
    null,
  );
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
        const overviewData = await getOverview();
        setOverview(overviewData);
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

  const highRiskCustomers =
    overview?.churn_risks.filter((customer) => customer.risk === "high")
      .length || 0;

  const topFeatureTheme = overview?.feature_requests[0]?.name || "No theme yet";

  return (
    <>
      <Header
        eyebrow="Overview"
        title="A lighter, product-facing view of customer risk and friction"
        description="See the strongest pain points, likely churn signals, and the technical health of your feedback pipeline without leading with storage internals."
        action={
          <StatusIndicator
            status={error ? "offline" : overview ? "healthy" : "warning"}
            label={
              error
                ? "Backend unavailable"
                : overview
                  ? "Product overview ready"
                  : "Overview loading"
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
              title="At-Risk Customers"
              value={overview?.churn_risks.length || 0}
              detail="Accounts with medium or high churn signals based on feedback language, urgency, and unresolved workflow pain."
              accent="linear-gradient(90deg, #fb7185, #fdba74)"
              icon={<ShieldAlert className="h-5 w-5" />}
            />
            <DashboardCard
              title="Top Pain Point"
              value={overview?.pain_points[0]?.name || "No signal yet"}
              detail={
                overview?.pain_points[0]?.summary ||
                "Upload more feedback to generate recurring issue summaries."
              }
              accent="linear-gradient(90deg, #0ea5a4, #67e8f9)"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <DashboardCard
              title="High-Risk Accounts"
              value={highRiskCustomers}
              detail="Customers showing the strongest retention-risk language and the most urgent signs of dissatisfaction."
              accent="linear-gradient(90deg, #38bdf8, #c4b5fd)"
              icon={<ShieldAlert className="h-5 w-5" />}
            />
            <DashboardCard
              title="Top Requested Theme"
              value={topFeatureTheme}
              detail="The most common improvement area customers want the team to address next."
              accent="linear-gradient(90deg, #22c55e, #86efac)"
              icon={<Lightbulb className="h-5 w-5" />}
            />
          </section>

          <section className="rounded-4xl border border-slate-200/80 bg-white/90 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tide">
              Product Summary
            </p>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-700">
              {overview?.summary_headline}
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6">
              <div className="rounded-4xl border border-slate-200/80 bg-white/92 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-ink">
                    Top customer problems
                  </h2>
                  <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-tide">
                    Product insight
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {overview?.pain_points.length ? (
                    overview.pain_points.map((signal) => (
                      <article
                        key={signal.name}
                        className="rounded-3xl border border-slate-200 bg-mist/45 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-ink">
                              {signal.name}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {signal.summary}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink shadow-sm">
                            {signal.count}
                          </span>
                        </div>
                        {signal.evidence.length ? (
                          <div className="mt-4 space-y-2">
                            {signal.evidence.map((quote) => (
                              <p
                                key={quote}
                                className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-600"
                              >
                                {quote}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <EmptyState
                      title="No recurring pain points yet"
                      description="Once feedback is ingested, the overview will group common customer problems into actionable themes."
                    />
                  )}
                </div>
              </div>

              <div className="rounded-4xl border border-slate-200/80 bg-white/92 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-ink">
                    Requested improvements
                  </h2>
                  <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-tide">
                    Opportunity map
                  </span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {overview?.feature_requests.length ? (
                    overview.feature_requests.map((signal) => (
                      <article
                        key={signal.name}
                        className="rounded-3xl border border-slate-200 bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-ink">
                            {signal.name}
                          </h3>
                          <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-tide">
                            {signal.count}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {signal.summary}
                        </p>
                      </article>
                    ))
                  ) : (
                    <div className="md:col-span-2">
                      <EmptyState
                        title="No clear feature themes yet"
                        description="Improvement requests will appear here after the system has enough customer feedback to cluster them."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-4xl border border-slate-200/80 bg-white/92 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-ink">
                    Potential churn watchlist
                  </h2>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                    Retention risk
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {overview?.churn_risks.length ? (
                    overview.churn_risks.map((customer) => (
                      <article
                        key={customer.customer}
                        className="rounded-3xl border border-slate-200 bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-ink">
                              {customer.customer}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                              Risk score: {customer.score}
                            </p>
                          </div>
                          <RiskBadge risk={customer.risk} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {customer.reasons.map((reason) => (
                            <span
                              key={reason}
                              className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                        <p className="mt-4 rounded-2xl bg-mist/45 px-4 py-3 text-sm leading-6 text-slate-700">
                          {customer.evidence}
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                          Sources: {customer.sources.join(", ") || "unknown"}
                        </p>
                      </article>
                    ))
                  ) : (
                    <EmptyState
                      title="No strong churn signals yet"
                      description="The system will surface customers here when their feedback includes switching intent, retention risk, or repeated blocking issues."
                    />
                  )}
                </div>
              </div>

              <div className="rounded-4xl border border-slate-200/80 bg-white/92 p-6 shadow-soft">
                <h2 className="text-xl font-semibold text-ink">
                  Recent activity
                </h2>
                <div className="mt-6 space-y-5 text-sm text-slate-600">
                  <div>
                    <p className="font-semibold text-ink">Recent uploads</p>
                    {uploads.length ? (
                      <div className="mt-3 space-y-3">
                        {uploads.slice(0, 3).map((upload) => (
                          <div
                            key={upload.id}
                            className="rounded-2xl bg-mist/45 p-4"
                          >
                            <p className="font-medium text-ink">
                              {upload.customer || "Unnamed customer"}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                              Added{" "}
                              {new Date(upload.createdAt).toLocaleDateString()}
                            </p>
                            <p className="mt-1">
                              Added feedback from{" "}
                              {upload.files.length > 0
                                ? upload.files.length
                                : 1}{" "}
                              source{upload.files.length === 1 ? "" : "s"}
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
                            className="rounded-2xl bg-mist/45 p-4"
                          >
                            <p className="font-medium text-ink">
                              {snapshot.query}
                            </p>
                            <p className="mt-1">
                              Insight snapshot saved for product review
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
            </div>
          </section>
        </>
      )}
    </>
  );
}
