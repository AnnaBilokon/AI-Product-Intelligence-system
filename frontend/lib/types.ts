export type FeedbackType =
  | "bug"
  | "feature_request"
  | "complaint"
  | "praise"
  | "question"
  | "general";

export interface HealthResponse {
  status: string;
  openai_configured: boolean;
  collection: string;
}

export interface StatsResponse {
  total_chunks: number;
  total_feedback_entries: number;
  customers: string[];
  sources: string[];
  collection_name: string;
  openai_configured: boolean;
}

export interface UploadResponse {
  message: string;
  ingested_entries: number;
  ingested_chunks: number;
  sources: string[];
}

export interface AnalysisRequest {
  query: string;
  customer?: string;
  source?: string;
  top_k?: number;
}

export interface AnalysisResponse {
  pain_points: string;
  feature_requests: string;
  themes: string;
  opportunities: string;
  context_count: number;
  filters: Record<string, string | null | undefined>;
}

export interface CustomerReportResponse {
  customer: string;
  report: string;
  feedback_count: number;
  sources: string[];
}

export interface UploadHistoryItem {
  id: string;
  createdAt: string;
  customer?: string;
  source?: string;
  files: string[];
  manualPreview?: string;
  ingestedEntries: number;
  ingestedChunks: number;
}

export interface InsightSnapshot {
  id: string;
  createdAt: string;
  query: string;
  customer?: string;
  source?: string;
  contextCount: number;
  result: AnalysisResponse;
}