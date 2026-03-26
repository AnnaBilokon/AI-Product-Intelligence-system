import type { InsightSnapshot, UploadHistoryItem } from "@/lib/types";

const UPLOAD_HISTORY_KEY = "ai-product-insights.upload-history";
const INSIGHT_HISTORY_KEY = "ai-product-insights.insight-history";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadUploadHistory(): UploadHistoryItem[] {
  return readJson<UploadHistoryItem[]>(UPLOAD_HISTORY_KEY, []);
}

export function saveUploadHistory(item: UploadHistoryItem): UploadHistoryItem[] {
  const next = [item, ...loadUploadHistory()].slice(0, 10);
  writeJson(UPLOAD_HISTORY_KEY, next);
  return next;
}

export function loadInsightSnapshots(): InsightSnapshot[] {
  return readJson<InsightSnapshot[]>(INSIGHT_HISTORY_KEY, []);
}

export function saveInsightSnapshot(item: InsightSnapshot): InsightSnapshot[] {
  const next = [item, ...loadInsightSnapshots()].slice(0, 10);
  writeJson(INSIGHT_HISTORY_KEY, next);
  return next;
}