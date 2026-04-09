export type FeedbackType =
  | "bug"
  | "feature_request"
  | "complaint"
  | "praise"
  | "question"
  | "general";

export type FeedbackTypeSelection = FeedbackType | "auto";

export type FeedbackTypeCounts = Partial<Record<FeedbackType, number>>;

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
  suggested_feedback_type?: FeedbackType;
  feedback_type_counts: FeedbackTypeCounts;
}

export interface AnalysisRequest {
  query: string;
  customer?: string;
  source?: string;
  top_k?: number;
}

export interface AnalysisResponse {
  answer: string;
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

export interface CustomerListItem {
  customer: string;
  feedback_count: number;
  sources: string[];
  latest_feedback_date?: string | null;
  churn_level: "low" | "medium" | "high";
  churn_score: number;
  churn_probability: number;
  churn_reasons: string[];
}

export interface CustomerFeedbackItem {
  feedback_id: string;
  source: string;
  type: string;
  date?: string | null;
  summary: string;
  preview: string;
  full_text: string;
  sentiment_score: number;
  sentiment_label: "positive" | "neutral" | "negative";
}

export interface SentimentTimelinePoint {
  period: string;
  label: string;
  average_sentiment: number;
  feedback_count: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
}

export interface CustomerDetailResponse {
  customer: string;
  report: string;
  feedback_count: number;
  sources: string[];
  churn_level: "low" | "medium" | "high";
  churn_score: number;
  churn_probability: number;
  churn_reasons: string[];
  average_sentiment: number;
  sentiment_timeline: SentimentTimelinePoint[];
  feedback_items: CustomerFeedbackItem[];
}

export interface OverviewSignal {
  name: string;
  count: number;
  summary: string;
  evidence: string[];
}

export interface ChurnRiskCustomer {
  customer: string;
  risk: "medium" | "high";
  score: number;
  reasons: string[];
  evidence: string;
  sources: string[];
}

export interface TechnicalMetrics {
  total_chunks: number;
  total_feedback_entries: number;
  customers_count: number;
  sources_count: number;
  collection_name: string;
  openai_configured: boolean;
}

export interface ProductOverviewResponse {
  summary_headline: string;
  pain_points: OverviewSignal[];
  feature_requests: OverviewSignal[];
  churn_risks: ChurnRiskCustomer[];
  technical_metrics: TechnicalMetrics;
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
  suggestedFeedbackType?: FeedbackType;
  feedbackTypeCounts?: FeedbackTypeCounts;
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