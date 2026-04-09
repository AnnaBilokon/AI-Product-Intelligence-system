"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  FileText,
  Layers3,
} from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getCustomerDetail, getCustomers } from "@/lib/api";
import type {
  CustomerDetailResponse,
  CustomerFeedbackItem,
  CustomerListItem,
  SentimentTimelinePoint,
} from "@/lib/types";

function formatDate(value?: string | null): string {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatType(value: string): string {
  return value.replaceAll("_", " ");
}

function sentimentTone(score: number) {
  if (score >= 20) {
    return "text-moss";
  }

  if (score <= -20) {
    return "text-rose-700";
  }

  return "text-slate-600";
}

function churnTone(level: "low" | "medium" | "high") {
  if (level === "high") {
    return {
      badge: "bg-rose-100 text-rose-700",
      bar: "bg-rose-500",
      text: "text-rose-700",
    };
  }

  if (level === "medium") {
    return {
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-500",
      text: "text-amber-700",
    };
  }

  return {
    badge: "bg-moss/10 text-moss",
    bar: "bg-moss",
    text: "text-moss",
  };
}

function ChurnMeter({
  level,
  probability,
}: {
  level: "low" | "medium" | "high";
  probability: number;
}) {
  const tone = churnTone(level);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone.badge}`}
        >
          {level} churn risk
        </span>
        <span className={`text-sm font-semibold ${tone.text}`}>
          {probability}%
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full ${tone.bar}`}
          style={{ width: `${Math.max(probability, 6)}%` }}
        />
      </div>
    </div>
  );
}

function FeedbackCard({ item }: { item: CustomerFeedbackItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tide">
            {formatType(item.type)}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-ink">{item.source}</h3>
          <p
            className={`mt-2 text-xs font-semibold uppercase tracking-[0.16em] ${sentimentTone(item.sentiment_score)}`}
          >
            {item.sentiment_label} sentiment ({item.sentiment_score})
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-paper px-3 py-1 text-xs font-medium text-slate-600">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(item.date)}
        </div>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-ink">
        {item.summary}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.preview}</p>

      <details className="mt-4 rounded-2xl bg-paper/80 p-4 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold text-ink">
          View full uploaded feedback
        </summary>
        <p className="mt-3 whitespace-pre-wrap leading-6">{item.full_text}</p>
      </details>
    </article>
  );
}

function SentimentTimelineChart({
  points,
}: {
  points: SentimentTimelinePoint[];
}) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No dated feedback for trend analysis"
        description="Add dates to uploaded feedback to unlock the sentiment trend timeline for this company."
      />
    );
  }

  const chartHeight = 180;
  const chartWidth = 640;
  const innerWidth = 560;
  const innerHeight = 120;
  const leftPadding = 40;
  const topPadding = 18;
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;
  const yForScore = (score: number) => {
    const normalized = (100 - (score + 100) / 2) / 100;
    return topPadding + normalized * innerHeight;
  };

  const polyline = points
    .map((point, index) => {
      const x = leftPadding + step * index;
      const y = yForScore(point.average_sentiment);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tide">
            Sentiment trend
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Average sentiment over time based on uploaded feedback dates.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="min-w-[640px]"
          role="img"
          aria-label="Sentiment analysis trend line"
        >
          <line
            x1="40"
            y1="18"
            x2="40"
            y2="138"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="78"
            x2="600"
            y2="78"
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="18"
            x2="600"
            y2="18"
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="138"
            x2="600"
            y2="138"
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          <polyline
            fill="none"
            stroke="#0f766e"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polyline}
          />
          {points.map((point, index) => {
            const x = leftPadding + step * index;
            const y = yForScore(point.average_sentiment);
            const tone =
              point.average_sentiment >= 20
                ? "#3f8f63"
                : point.average_sentiment <= -20
                  ? "#be123c"
                  : "#64748b";

            return (
              <g key={point.period}>
                <circle cx={x} cy={y} r="5" fill={tone} />
                <text
                  x={x}
                  y="160"
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px]"
                >
                  {point.label}
                </text>
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="fill-slate-700 text-[11px]"
                >
                  {point.average_sentiment}
                </text>
              </g>
            );
          })}
          <text x="10" y="22" className="fill-slate-400 text-[10px]">
            +100
          </text>
          <text x="16" y="82" className="fill-slate-400 text-[10px]">
            0
          </text>
          <text x="8" y="142" className="fill-slate-400 text-[10px]">
            -100
          </text>
        </svg>
      </div>
    </div>
  );
}

export function CompanyExplorer() {
  const [companies, setCompanies] = useState<CustomerListItem[]>([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "churn_desc" | "feedback_desc" | "latest_desc" | "name_asc"
  >("churn_desc");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [detail, setDetail] = useState<CustomerDetailResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filteredCompanies = companies.filter((company) => {
    const query = companyQuery.trim().toLowerCase();
    return !query || company.customer.toLowerCase().includes(query);
  });
  const sortedCompanies = [...filteredCompanies].sort((left, right) => {
    if (sortBy === "feedback_desc") {
      return (
        right.feedback_count - left.feedback_count ||
        right.churn_probability - left.churn_probability ||
        left.customer.localeCompare(right.customer)
      );
    }

    if (sortBy === "latest_desc") {
      return (
        (right.latest_feedback_date || "").localeCompare(
          left.latest_feedback_date || "",
        ) ||
        right.churn_probability - left.churn_probability ||
        left.customer.localeCompare(right.customer)
      );
    }

    if (sortBy === "name_asc") {
      return left.customer.localeCompare(right.customer);
    }

    return (
      right.churn_probability - left.churn_probability ||
      right.feedback_count - left.feedback_count ||
      left.customer.localeCompare(right.customer)
    );
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCompanies() {
      setListLoading(true);
      setError(null);

      try {
        const response = await getCustomers();
        if (cancelled) {
          return;
        }

        setCompanies(response);
        if (response.length > 0) {
          setSelectedCompany((current) => current || response[0].customer);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load companies.",
          );
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    }

    void loadCompanies();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setDetail(null);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);
      setError(null);

      try {
        const response = await getCustomerDetail(selectedCompany);
        if (!cancelled) {
          setDetail(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load company details.",
          );
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedCompany]);

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
      <section className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-paper p-3 text-ink">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Companies</h2>
            <p className="text-sm text-slate-600">
              Choose a company to review its account summary, insights, and
              every uploaded feedback item.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">
              Search companies
            </span>
            <input
              value={companyQuery}
              onChange={(event) => setCompanyQuery(event.target.value)}
              placeholder="Find a company by name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-1">
            <label>
              <span className="mb-2 block text-sm font-medium text-ink">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | "churn_desc"
                      | "feedback_desc"
                      | "latest_desc"
                      | "name_asc",
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
              >
                <option value="churn_desc">Highest churn probability</option>
                <option value="feedback_desc">Most feedback uploads</option>
                <option value="latest_desc">Most recent feedback</option>
                <option value="name_asc">Company name</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Showing {filteredCompanies.length} of {companies.length} companies.
          </p>
        </div>

        {listLoading ? (
          <div className="mt-6">
            <LoadingSpinner label="Loading companies" />
          </div>
        ) : sortedCompanies.length > 0 ? (
          <div className="mt-6 space-y-3">
            {sortedCompanies.map((company) => {
              const active = company.customer === selectedCompany;

              return (
                <button
                  key={company.customer}
                  type="button"
                  onClick={() => setSelectedCompany(company.customer)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-slate-200 bg-white/80 text-ink hover:border-slate-300 hover:bg-paper"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">
                        {company.customer}
                      </p>
                      <p
                        className={`mt-2 text-sm ${
                          active ? "text-paper/75" : "text-slate-600"
                        }`}
                      >
                        {company.sources.join(", ") || "No sources yet"}
                      </p>
                      <div className="mt-3">
                        <ChurnMeter
                          level={company.churn_level}
                          probability={company.churn_probability}
                        />
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                        active
                          ? "bg-white/10 text-paper"
                          : "bg-paper text-slate-600"
                      }`}
                    >
                      {company.feedback_count} uploads
                    </div>
                  </div>
                  <p
                    className={`mt-3 text-xs ${
                      active ? "text-paper/65" : "text-slate-500"
                    }`}
                  >
                    Latest feedback: {formatDate(company.latest_feedback_date)}
                  </p>
                </button>
              );
            })}
          </div>
        ) : companies.length > 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No matching companies"
              description="Try a different company name or clear the search to see the full list again."
            />
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="No companies yet"
              description="Upload feedback with customer names to build a clickable company list here."
            />
          </div>
        )}
      </section>

      <section className="space-y-6">
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {detailLoading ? (
          <LoadingSpinner label="Loading company details" />
        ) : null}

        {detail ? (
          <>
            <div className="rounded-4xl border border-white/60 bg-white/90 p-6 shadow-panel">
              <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-paper via-white to-slate-50 p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-ink p-3 text-paper shadow-sm">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tide">
                          Company intelligence
                        </p>
                        <h2 className="mt-1 text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                          {detail.customer}
                        </h2>
                      </div>
                    </div>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                      Review account-level product signals, churn pressure,
                      sentiment direction, and every uploaded feedback item in
                      one place.
                    </p>
                  </div>

                  <div className="w-full max-w-xl space-y-3 lg:min-w-[360px]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Uploaded feedback
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-ink">
                          <Layers3 className="h-5 w-5" />
                          {detail.feedback_count}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Avg sentiment
                        </p>
                        <p
                          className={`mt-2 text-2xl font-semibold ${sentimentTone(detail.average_sentiment)}`}
                        >
                          {detail.average_sentiment}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Churn probability
                      </p>
                      <div className="mt-3">
                        <ChurnMeter
                          level={detail.churn_level}
                          probability={detail.churn_probability}
                        />
                      </div>
                      {detail.churn_reasons.length > 0 ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          Signals: {detail.churn_reasons.join(" | ")}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          No strong churn signals detected in the uploaded
                          feedback.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {detail.report}
              </div>
            </div>

            <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-paper p-3 text-ink">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-ink">
                    Sentiment timeline
                  </h3>
                  <p className="text-sm text-slate-600">
                    See how feedback sentiment has shifted over time for this
                    company.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <SentimentTimelineChart points={detail.sentiment_timeline} />
              </div>
            </div>

            <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-paper p-3 text-ink">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-ink">
                    Uploaded feedback timeline
                  </h3>
                  <p className="text-sm text-slate-600">
                    Review each uploaded feedback item, its short summary, and
                    the full stored text.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {detail.feedback_items.map((item) => (
                  <FeedbackCard key={item.feedback_id} item={item} />
                ))}
              </div>
            </div>
          </>
        ) : !listLoading ? (
          <EmptyState
            title="No company selected"
            description="Choose a company from the list to review its full account context and uploaded feedback history."
          />
        ) : null}
      </section>
    </div>
  );
}
