"use client";

import { useState } from "react";

import { CustomerSearch } from "@/components/CustomerSearch";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { generateCustomerReport } from "@/lib/api";
import type { CustomerReportResponse } from "@/lib/types";

export function CustomerReport() {
  const [customer, setCustomer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CustomerReportResponse | null>(null);

  const handleSearch = async () => {
    if (!customer.trim()) {
      setError("Enter a customer name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateCustomerReport(customer.trim());
      setReport(response);
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : "Unable to generate the report.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <CustomerSearch
        value={customer}
        onChange={setCustomer}
        onSearch={handleSearch}
        loading={loading}
      />

      {loading ? <LoadingSpinner label="Building customer report" /> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {report ? (
        <div className="rounded-4xl border border-white/60 bg-white/90 p-6 shadow-panel">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tide">
                Customer Intelligence
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">
                {report.customer}
              </h2>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:text-right">
              <p>
                <span className="font-semibold text-ink">
                  Relevant feedback excerpts:
                </span>{" "}
                {report.feedback_count}
              </p>
              <p>
                <span className="font-semibold text-ink">Sources:</span>{" "}
                {report.sources.join(", ") || "None"}
              </p>
            </div>
          </div>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {report.report}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No report yet"
          description="Search for a customer after feedback has been ingested to generate an account-level report for product, CS, or sales conversations."
        />
      )}
    </div>
  );
}
