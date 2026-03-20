from __future__ import annotations

from typing import Annotated, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from analysis_service import AnalysisService
from config import APP_TITLE, APP_VERSION, CHROMA_COLLECTION_NAME, CHROMA_DB_PATH, CORS_ORIGINS, is_openai_configured
from customer_service import CustomerReportService
from feedback_service import FeedbackIngestionService
from models import (
    AnalysisRequest,
    AnalysisResponse,
    ClearResponse,
    CustomerReportRequest,
    CustomerReportResponse,
    StatsResponse,
    UploadResponse,
)
from rag import FeedbackRAG
from vector_store import ChromaVectorStore

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = ChromaVectorStore(
    persist_path=CHROMA_DB_PATH, collection_name=CHROMA_COLLECTION_NAME)
rag = FeedbackRAG(vector_store=vector_store)
feedback_service = FeedbackIngestionService()
analysis_service = AnalysisService(rag=rag)
customer_service = CustomerReportService(rag=rag)


@app.get("/")
def root() -> dict:
    return {
        "name": APP_TITLE,
        "version": APP_VERSION,
        "docs": "/docs",
        "routes": [
            "/health",
            "/feedback/upload",
            "/analysis/run",
            "/customer/report",
            "/stats",
            "/clear",
        ],
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "openai_configured": is_openai_configured(),
        "collection": CHROMA_COLLECTION_NAME,
    }


@app.post("/feedback/upload", response_model=UploadResponse)
async def upload_feedback(
    files: Annotated[Optional[List[UploadFile]], File(default=None)] = None,
    manual_text: Annotated[Optional[str], Form(default=None)] = None,
    customer: Annotated[Optional[str], Form(default=None)] = None,
    source: Annotated[Optional[str], Form(default=None)] = None,
    feedback_type: Annotated[Optional[str], Form(default=None)] = None,
    date: Annotated[Optional[str], Form(default=None)] = None,
) -> UploadResponse:
    if not files and not manual_text:
        raise HTTPException(
            status_code=400, detail="Provide at least one file or manual_text.")

    try:
        entries = await feedback_service.parse_inputs(files, manual_text, customer, source, feedback_type, date)
        if not entries:
            raise HTTPException(
                status_code=400, detail="No feedback entries could be parsed from the input.")

        ingestion = rag.ingest(entries)
        sources = sorted({entry.source for entry in entries})
        return UploadResponse(
            message="Feedback ingested successfully.",
            ingested_entries=ingestion["entries"],
            ingested_chunks=ingestion["chunks"],
            sources=sources,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/analysis/run", response_model=AnalysisResponse)
def run_analysis(request: AnalysisRequest) -> AnalysisResponse:
    try:
        return analysis_service.run(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/customer/report", response_model=CustomerReportResponse)
def customer_report(request: CustomerReportRequest) -> CustomerReportResponse:
    try:
        return customer_service.generate(request.customer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/stats", response_model=StatsResponse)
def stats() -> StatsResponse:
    data = rag.get_stats()
    return StatsResponse(**data, openai_configured=is_openai_configured())


@app.post("/clear", response_model=ClearResponse)
def clear_collection() -> ClearResponse:
    cleared_chunks = rag.clear()
    return ClearResponse(message="Collection cleared.", cleared_chunks=cleared_chunks)
