from __future__ import annotations

from openai import OpenAI

from config import OPENAI_ANALYSIS_MODEL, OPENAI_API_KEY
from models import CustomerReportResponse
from prompts import CUSTOMER_REPORT_PROMPT, build_prompt
from rag import FeedbackRAG


class CustomerReportService:
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
                    "content": "You create clear customer intelligence reports for account and product teams.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content or "No response returned."

    def generate(self, customer: str) -> CustomerReportResponse:
        rows = self.rag.get_customer_feedback(customer)
        if not rows:
            return CustomerReportResponse(
                customer=customer,
                report="No feedback was found for this customer.",
                feedback_count=0,
                sources=[],
            )

        context = "\n\n".join(row["text"] for row in rows)
        sources = sorted({row["metadata"].get("source", "")
                         for row in rows if row["metadata"].get("source")})

        try:
            report = self._run_completion(build_prompt(
                CUSTOMER_REPORT_PROMPT, context=context, customer=customer))
        except Exception:
            report = (
                f"Customer {customer} has {len(rows)} feedback chunks across {len(sources)} sources. "
                "Configure OpenAI to generate a full narrative report."
            )

        return CustomerReportResponse(
            customer=customer,
            report=report,
            feedback_count=len(rows),
            sources=sources,
        )
