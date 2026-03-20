from __future__ import annotations

from openai import OpenAI

from analysis import simple_analysis
from config import OPENAI_ANALYSIS_MODEL, OPENAI_API_KEY
from models import AnalysisRequest, AnalysisResponse
from prompts import (
    FEATURE_REQUEST_ANALYSIS_PROMPT,
    OPPORTUNITIES_ANALYSIS_PROMPT,
    PAIN_POINT_ANALYSIS_PROMPT,
    THEMES_ANALYSIS_PROMPT,
    build_prompt,
)
from rag import FeedbackRAG


class AnalysisService:
    def __init__(self, rag: FeedbackRAG) -> None:
        self.rag = rag
        self.client = OpenAI(
            api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    def _run_completion(self, prompt: str) -> str:
        if self.client is None:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        response = self.client.chat.completions.create(
            model=OPENAI_ANALYSIS_MODEL,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": "You analyze customer feedback and return concise product insights.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content or "No response returned."

    def run(self, request: AnalysisRequest) -> AnalysisResponse:
        retrieval = self.rag.retrieve_context(
            query=request.query,
            customer=request.customer,
            source=request.source,
            top_k=request.top_k,
        )
        records = retrieval["records"]
        context = retrieval["context"]

        filters = {"customer": request.customer, "source": request.source}
        if not records:
            empty_message = "No matching feedback was found. Upload feedback or adjust the filters."
            return AnalysisResponse(
                pain_points=empty_message,
                feature_requests=empty_message,
                themes=empty_message,
                opportunities=empty_message,
                context_count=0,
                filters=filters,
            )

        try:
            pain_points = self._run_completion(build_prompt(
                PAIN_POINT_ANALYSIS_PROMPT, context, request.query))
            feature_requests = self._run_completion(build_prompt(
                FEATURE_REQUEST_ANALYSIS_PROMPT, context, request.query))
            themes = self._run_completion(build_prompt(
                THEMES_ANALYSIS_PROMPT, context, request.query))
            opportunities = self._run_completion(build_prompt(
                OPPORTUNITIES_ANALYSIS_PROMPT, context, request.query))
        except Exception:
            fallback = simple_analysis(match["text"] for match in records)
            pain_points = fallback["pain_points"]
            feature_requests = fallback["feature_requests"]
            themes = fallback["themes"]
            opportunities = fallback["opportunities"]

        return AnalysisResponse(
            pain_points=pain_points,
            feature_requests=feature_requests,
            themes=themes,
            opportunities=opportunities,
            context_count=len(records),
            filters=filters,
        )
