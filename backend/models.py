from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FeedbackEntry(BaseModel):
    id: str
    customer: str = Field(default="Unknown Customer")
    source: str = Field(default="manual")
    type: str = Field(default="general")
    date: Optional[str] = None
    text: str = Field(min_length=1)


class FeedbackChunk(BaseModel):
    chunk_id: str
    feedback_id: str
    customer: str
    source: str
    type: str
    date: Optional[str] = None
    chunk_index: int
    text: str
    token_count: int = 0


class UploadRequest(BaseModel):
    manual_text: Optional[str] = None
    customer: Optional[str] = None
    source: Optional[str] = None
    feedback_type: Optional[str] = None
    date: Optional[str] = None


class UploadResponse(BaseModel):
    message: str
    ingested_entries: int
    ingested_chunks: int
    sources: List[str] = Field(default_factory=list)
    suggested_feedback_type: Optional[str] = None
    feedback_type_counts: Dict[str, int] = Field(default_factory=dict)


class AnalysisRequest(BaseModel):
    query: str = Field(
        default="Analyze the most important signals in this product feedback.")
    customer: Optional[str] = None
    source: Optional[str] = None
    top_k: int = Field(default=6, ge=1, le=20)


class AnalysisResponse(BaseModel):
    answer: str
    pain_points: str
    feature_requests: str
    themes: str
    opportunities: str
    context_count: int
    filters: Dict[str, Any] = Field(default_factory=dict)


class CustomerReportRequest(BaseModel):
    customer: str = Field(min_length=1)


class CustomerReportResponse(BaseModel):
    customer: str
    report: str
    feedback_count: int
    sources: List[str] = Field(default_factory=list)


class CustomerListItem(BaseModel):
    customer: str
    feedback_count: int
    sources: List[str] = Field(default_factory=list)
    latest_feedback_date: Optional[str] = None
    churn_level: str = "low"
    churn_score: int = 0
    churn_probability: int = 0
    churn_reasons: List[str] = Field(default_factory=list)


class CustomerFeedbackItem(BaseModel):
    feedback_id: str
    source: str
    type: str
    date: Optional[str] = None
    summary: str
    preview: str
    full_text: str
    sentiment_score: int = 0
    sentiment_label: str = "neutral"


class SentimentTimelinePoint(BaseModel):
    period: str
    label: str
    average_sentiment: int
    feedback_count: int
    positive_count: int = 0
    neutral_count: int = 0
    negative_count: int = 0


class CustomerDetailResponse(BaseModel):
    customer: str
    report: str
    feedback_count: int
    sources: List[str] = Field(default_factory=list)
    churn_level: str = "low"
    churn_score: int = 0
    churn_probability: int = 0
    churn_reasons: List[str] = Field(default_factory=list)
    average_sentiment: int = 0
    sentiment_timeline: List[SentimentTimelinePoint] = Field(
        default_factory=list)
    feedback_items: List[CustomerFeedbackItem] = Field(default_factory=list)


class StatsResponse(BaseModel):
    total_chunks: int
    total_feedback_entries: int
    customers: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    collection_name: str
    openai_configured: bool


class ClearResponse(BaseModel):
    message: str
    cleared_chunks: int


class OverviewSignal(BaseModel):
    name: str
    count: int
    summary: str
    evidence: List[str] = Field(default_factory=list)


class ChurnRiskCustomer(BaseModel):
    customer: str
    risk: str
    score: int
    reasons: List[str] = Field(default_factory=list)
    evidence: str
    sources: List[str] = Field(default_factory=list)


class TechnicalMetrics(BaseModel):
    total_chunks: int
    total_feedback_entries: int
    customers_count: int
    sources_count: int
    collection_name: str
    openai_configured: bool


class ProductOverviewResponse(BaseModel):
    summary_headline: str
    pain_points: List[OverviewSignal] = Field(default_factory=list)
    feature_requests: List[OverviewSignal] = Field(default_factory=list)
    churn_risks: List[ChurnRiskCustomer] = Field(default_factory=list)
    technical_metrics: TechnicalMetrics
