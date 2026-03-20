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


class AnalysisRequest(BaseModel):
    query: str = Field(
        default="Analyze the most important signals in this product feedback.")
    customer: Optional[str] = None
    source: Optional[str] = None
    top_k: int = Field(default=6, ge=1, le=20)


class AnalysisResponse(BaseModel):
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
