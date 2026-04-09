"use client";

import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import {
  FeedbackForm,
  type FeedbackFormValues,
} from "@/components/FeedbackForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { uploadFeedback } from "@/lib/api";
import { loadUploadHistory, saveUploadHistory } from "@/lib/storage";
import type {
  FeedbackType,
  FeedbackTypeCounts,
  UploadHistoryItem,
  UploadResponse,
} from "@/lib/types";

const initialValues: FeedbackFormValues = {
  manualText: "",
  customer: "",
  source: "",
  feedbackType: "auto",
  date: "",
};

function formatFeedbackTypeLabel(type: string): string {
  return type.replaceAll("_", " ");
}

function formatDetectedMix(
  counts: FeedbackTypeCounts | undefined,
): string | null {
  if (!counts) {
    return null;
  }

  const parts = Object.entries(counts)
    .filter((entry): entry is [FeedbackType, number] => Boolean(entry[1]))
    .sort((left, right) => right[1] - left[1])
    .map(([type, count]) => `${formatFeedbackTypeLabel(type)}: ${count}`);

  return parts.length > 0 ? parts.join(" | ") : null;
}

export function UploadFeedback() {
  const [values, setValues] = useState<FeedbackFormValues>(initialValues);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setHistory(loadUploadHistory());
  }, []);

  const handleChange = (field: keyof FeedbackFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!files.length && !values.manualText.trim()) {
      setError(
        "Add at least one file or some manual feedback before uploading.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (values.manualText.trim()) {
        formData.append("manual_text", values.manualText.trim());
      }
      if (values.customer.trim()) {
        formData.append("customer", values.customer.trim());
      }
      if (values.source.trim()) {
        formData.append("source", values.source.trim());
      }
      if (values.feedbackType !== "auto") {
        formData.append("feedback_type", values.feedbackType);
      }
      if (values.date) {
        formData.append("date", values.date);
      }

      for (const file of files) {
        formData.append("files", file);
      }

      const response = await uploadFeedback(formData);
      setResult(response);
      setHistory(
        saveUploadHistory({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          customer: values.customer || undefined,
          source: values.source || undefined,
          files: files.map((file) => file.name),
          manualPreview: values.manualText.slice(0, 120) || undefined,
          ingestedEntries: response.ingested_entries,
          ingestedChunks: response.ingested_chunks,
          suggestedFeedbackType: response.suggested_feedback_type,
          feedbackTypeCounts: response.feedback_type_counts,
        }),
      );
      setValues(initialValues);
      setFiles([]);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Upload failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr,0.9fr]">
      <section className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-panel backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-paper p-3 text-ink">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Upload feedback</h2>
            <p className="text-sm text-slate-600">
              Attach TXT, CSV, or PDF files, add manual notes, or combine both
              in a single upload.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-paper/50 p-4">
          <label className="block cursor-pointer text-sm font-medium text-ink">
            Select files
            <input
              type="file"
              multiple
              accept=".txt,.csv,.pdf"
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []))
              }
              className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-paper"
            />
          </label>
          {files.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((file) => (
                <span
                  key={file.name}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                >
                  {file.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <FeedbackForm values={values} onChange={handleChange} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Uploading..." : "Ingest feedback"}
          </button>
          {submitting ? (
            <LoadingSpinner label="Sending feedback to the API" />
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          {result ? (
            <p className="text-sm text-moss">{result.message}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-ink">
            Latest upload result
          </h3>
          {result ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-ink">Feedback items:</span>{" "}
                {result.ingested_entries}
              </p>
              <p>
                <span className="font-semibold text-ink">
                  Search-ready records:
                </span>{" "}
                {result.ingested_chunks}
              </p>
              <p>
                <span className="font-semibold text-ink">Sources:</span>{" "}
                {result.sources.join(", ") || "None"}
              </p>
              <p>
                <span className="font-semibold text-ink">Suggested type:</span>{" "}
                {result.suggested_feedback_type
                  ? formatFeedbackTypeLabel(result.suggested_feedback_type)
                  : "Not enough signal"}
              </p>
              {formatDetectedMix(result.feedback_type_counts) ? (
                <p>
                  <span className="font-semibold text-ink">Detected mix:</span>{" "}
                  {formatDetectedMix(result.feedback_type_counts)}
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="No upload yet"
              description="Once feedback is ingested, this panel shows how many feedback items and search-ready records were stored, plus the suggested feedback type."
            />
          )}
        </div>

        <div className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-ink">Upload history</h3>
          {history.length > 0 ? (
            <div className="mt-4 space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 p-4 text-sm text-slate-600"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-ink">
                      {item.customer || "Unnamed customer"}
                    </p>
                    <p>{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-2">{item.source || "manual"}</p>
                  <p className="mt-2">
                    Feedback items: {item.ingestedEntries} | Search-ready
                    records: {item.ingestedChunks}
                  </p>
                  {item.suggestedFeedbackType ? (
                    <p className="mt-2">
                      Suggested type:{" "}
                      {formatFeedbackTypeLabel(item.suggestedFeedbackType)}
                    </p>
                  ) : null}
                  {formatDetectedMix(item.feedbackTypeCounts) ? (
                    <p className="mt-2">
                      Detected mix: {formatDetectedMix(item.feedbackTypeCounts)}
                    </p>
                  ) : null}
                  {item.files.length > 0 ? (
                    <p className="mt-2">Files: {item.files.join(", ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Local upload history will appear here after your first successful
              ingest.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
