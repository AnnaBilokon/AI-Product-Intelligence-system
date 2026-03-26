"use client";

import { ChangeEvent } from "react";

import type { FeedbackType } from "@/lib/types";

export interface FeedbackFormValues {
  manualText: string;
  customer: string;
  source: string;
  feedbackType: FeedbackType;
  date: string;
}

const FEEDBACK_TYPES: FeedbackType[] = [
  "bug",
  "feature_request",
  "complaint",
  "praise",
  "question",
  "general",
];

interface FeedbackFormProps {
  values: FeedbackFormValues;
  onChange: (field: keyof FeedbackFormValues, value: string) => void;
}

export function FeedbackForm({ values, onChange }: FeedbackFormProps) {
  const handleFieldChange =
    (field: keyof FeedbackFormValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      onChange(field, event.target.value);
    };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="md:col-span-2">
        <span className="mb-2 block text-sm font-medium text-ink">
          Manual feedback
        </span>
        <textarea
          value={values.manualText}
          onChange={handleFieldChange("manualText")}
          rows={7}
          placeholder="Paste interview notes, support tickets, call summaries, or survey responses here."
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
        />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-ink">
          Customer
        </span>
        <input
          value={values.customer}
          onChange={handleFieldChange("customer")}
          placeholder="Acme Corp"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
        />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-ink">Source</span>
        <input
          value={values.source}
          onChange={handleFieldChange("source")}
          placeholder="interview, survey, support"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
        />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-ink">
          Feedback type
        </span>
        <select
          value={values.feedbackType}
          onChange={handleFieldChange("feedbackType")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
        >
          {FEEDBACK_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-ink">Date</span>
        <input
          type="date"
          value={values.date}
          onChange={handleFieldChange("date")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/10"
        />
      </label>
    </div>
  );
}
