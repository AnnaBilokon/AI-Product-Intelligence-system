from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
import re

from openai import OpenAI

from config import OPENAI_ANALYSIS_MODEL, OPENAI_API_KEY
from models import (
    CustomerDetailResponse,
    CustomerFeedbackItem,
    CustomerListItem,
    CustomerReportResponse,
    SentimentTimelinePoint,
)
from prompts import CUSTOMER_REPORT_PROMPT, build_prompt
from rag import FeedbackRAG


CHURN_PATTERNS = [
    (
        "Mentions switching or evaluating alternatives",
        5,
        ["switch", "alternative", "competitor", "migrate", "replacement"],
    ),
    (
        "Signals renewal or retention risk",
        5,
        ["renewal", "not renewing", "cancel", "churn", "leave", "stop using"],
    ),
    (
        "Blocking workflow issues are affecting adoption",
        3,
        ["blocking", "blocked", "cannot", "can't", "unusable", "stuck"],
    ),
    (
        "Repeated frustration and urgency in the feedback",
        2,
        ["frustrating", "frustrated", "urgent", "disappointed", "escalation"],
    ),
]

POSITIVE_PATTERNS = {
    "love",
    "great",
    "helpful",
    "excellent",
    "smooth",
    "easy",
    "fast",
    "useful",
    "improved",
    "good",
    "reliable",
    "happy",
}

NEGATIVE_PATTERNS = {
    "bad",
    "broken",
    "crash",
    "slow",
    "frustrated",
    "frustrating",
    "bug",
    "issue",
    "blocking",
    "blocked",
    "unusable",
    "disappointed",
    "confusing",
    "lag",
    "timeout",
    "cancel",
    "churn",
}


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

    def _merge_chunk_texts(self, chunks: list[str]) -> str:
        if not chunks:
            return ""

        merged = chunks[0].strip()
        for chunk in chunks[1:]:
            candidate = chunk.strip()
            if not candidate:
                continue

            max_overlap = min(len(merged), len(candidate), 240)
            overlap = 0
            for size in range(max_overlap, 24, -1):
                if merged.endswith(candidate[:size]):
                    overlap = size
                    break

            if overlap:
                merged += candidate[overlap:]
            elif candidate not in merged:
                merged = f"{merged}\n\n{candidate}" if merged else candidate

        return merged.strip()

    def _summarize_feedback_text(self, text: str) -> str:
        cleaned = " ".join(text.split())
        if not cleaned:
            return "No summary available."

        sentences = re.split(r"(?<=[.!?])\s+", cleaned)
        summary = " ".join(sentences[:2]).strip()
        if not summary:
            summary = cleaned[:220].strip()

        if len(summary) > 240:
            summary = f"{summary[:237].rstrip()}..."

        return summary

    def _build_feedback_items(self, rows: list[dict]) -> list[CustomerFeedbackItem]:
        grouped: dict[str, list[dict]] = defaultdict(list)
        for row in rows:
            feedback_id = row["metadata"].get("feedback_id") or row.get("id")
            grouped[feedback_id].append(row)

        items: list[CustomerFeedbackItem] = []
        for feedback_id, feedback_rows in grouped.items():
            ordered_rows = sorted(
                feedback_rows,
                key=lambda item: (
                    item["metadata"].get("date", ""),
                    item["metadata"].get("chunk_index", 0),
                ),
            )
            metadata = ordered_rows[0]["metadata"]
            full_text = self._merge_chunk_texts(
                [row["text"] for row in ordered_rows])
            preview = full_text if len(
                full_text) <= 360 else f"{full_text[:357].rstrip()}..."
            sentiment_score, sentiment_label = self._sentiment_snapshot(
                full_text, metadata.get("type", "general"))
            items.append(
                CustomerFeedbackItem(
                    feedback_id=feedback_id,
                    source=metadata.get("source", "unknown"),
                    type=metadata.get("type", "general"),
                    date=metadata.get("date") or None,
                    summary=self._summarize_feedback_text(full_text),
                    preview=preview,
                    full_text=full_text,
                    sentiment_score=sentiment_score,
                    sentiment_label=sentiment_label,
                )
            )

        return sorted(
            items,
            key=lambda item: ((item.date or ""), item.feedback_id),
            reverse=True,
        )

    def _sentiment_snapshot(self, text: str, feedback_type: str) -> tuple[int, str]:
        lowered = text.lower()
        positive_hits = sum(
            1 for keyword in POSITIVE_PATTERNS if keyword in lowered)
        negative_hits = sum(
            1 for keyword in NEGATIVE_PATTERNS if keyword in lowered)

        base_score = (positive_hits - negative_hits) * 18
        if feedback_type == "praise":
            base_score += 20
        elif feedback_type in {"complaint", "bug"}:
            base_score -= 20

        score = max(-100, min(100, base_score))
        label = "neutral"
        if score >= 20:
            label = "positive"
        elif score <= -20:
            label = "negative"

        return score, label

    def _timeline_period(self, date_value: str | None) -> tuple[str, str] | None:
        if not date_value:
            return None

        try:
            parsed = datetime.fromisoformat(date_value)
            return parsed.strftime("%Y-%m-%d"), parsed.strftime("%b %d")
        except ValueError:
            if len(date_value) >= 10:
                return date_value[:10], date_value[:10]
            return date_value, date_value

    def _build_sentiment_timeline(
        self, items: list[CustomerFeedbackItem]
    ) -> tuple[int, list[SentimentTimelinePoint]]:
        dated_items = [item for item in items if item.date]
        if not dated_items:
            average = round(
                sum(item.sentiment_score for item in items) / len(items)) if items else 0
            return average, []

        grouped: dict[str, dict[str, int | str]] = {}
        for item in dated_items:
            period_info = self._timeline_period(item.date)
            if period_info is None:
                continue

            period, label = period_info
            bucket = grouped.setdefault(
                period,
                {
                    "label": label,
                    "score_total": 0,
                    "feedback_count": 0,
                    "positive_count": 0,
                    "neutral_count": 0,
                    "negative_count": 0,
                },
            )
            bucket["score_total"] += item.sentiment_score
            bucket["feedback_count"] += 1
            bucket[f"{item.sentiment_label}_count"] += 1

        timeline = [
            SentimentTimelinePoint(
                period=period,
                label=str(bucket["label"]),
                average_sentiment=round(
                    bucket["score_total"] / bucket["feedback_count"]),
                feedback_count=int(bucket["feedback_count"]),
                positive_count=int(bucket["positive_count"]),
                neutral_count=int(bucket["neutral_count"]),
                negative_count=int(bucket["negative_count"]),
            )
            for period, bucket in sorted(grouped.items(), key=lambda item: item[0])
        ]

        average = round(
            sum(item.sentiment_score for item in items) / len(items)) if items else 0
        return average, timeline

    def _score_feedback_item(self, item: CustomerFeedbackItem) -> tuple[int, list[str]]:
        lowered = item.full_text.lower()
        score = 0
        reasons: list[str] = []

        if item.type in {"complaint", "bug"}:
            score += 1

        for reason, weight, keywords in CHURN_PATTERNS:
            if any(keyword in lowered for keyword in keywords):
                score += weight
                reasons.append(reason)

        return score, reasons

    def _churn_snapshot(self, items: list[CustomerFeedbackItem]) -> dict[str, object]:
        total_score = 0
        reasons: Counter[str] = Counter()

        for item in items:
            item_score, item_reasons = self._score_feedback_item(item)
            total_score += item_score
            for reason in item_reasons:
                reasons[reason] += 1

        churn_level = "low"
        if total_score >= 8:
            churn_level = "high"
        elif total_score >= 3:
            churn_level = "medium"

        churn_probability = min(95, total_score * 10)

        return {
            "churn_level": churn_level,
            "churn_score": total_score,
            "churn_probability": churn_probability,
            "churn_reasons": [reason for reason, _ in reasons.most_common(3)],
        }

    def list_customers(self) -> list[CustomerListItem]:
        rows = self.rag.get_all_feedback()
        grouped: dict[str, list[dict]] = defaultdict(list)

        for row in rows:
            metadata = row["metadata"]
            customer = metadata.get("customer") or "Unknown Customer"
            grouped[customer].append(row)

        return [
            self._build_customer_list_item(customer, customer_rows)
            for customer, customer_rows in sorted(grouped.items(), key=lambda item: item[0].lower())
        ]

    def _build_customer_list_item(self, customer: str, rows: list[dict]) -> CustomerListItem:
        feedback_items = self._build_feedback_items(rows)
        churn = self._churn_snapshot(feedback_items)
        latest_feedback_date = max(
            (item.date for item in feedback_items if item.date), default=None)
        sources = sorted(
            {item.source for item in feedback_items if item.source})

        return CustomerListItem(
            customer=customer,
            feedback_count=len(feedback_items),
            sources=sources,
            latest_feedback_date=latest_feedback_date,
            churn_level=churn["churn_level"],
            churn_score=churn["churn_score"],
            churn_probability=churn["churn_probability"],
            churn_reasons=churn["churn_reasons"],
        )

    def get_customer_detail(self, customer: str) -> CustomerDetailResponse:
        rows = self.rag.get_customer_feedback(customer)
        if not rows:
            return CustomerDetailResponse(
                customer=customer,
                report="No feedback was found for this customer.",
                feedback_count=0,
                sources=[],
                feedback_items=[],
            )

        feedback_items = self._build_feedback_items(rows)
        churn = self._churn_snapshot(feedback_items)
        average_sentiment, sentiment_timeline = self._build_sentiment_timeline(
            feedback_items)
        context = "\n\n".join(item.full_text for item in feedback_items)
        sources = sorted(
            {item.source for item in feedback_items if item.source})

        try:
            report = self._run_completion(build_prompt(
                CUSTOMER_REPORT_PROMPT, context=context, customer=customer))
        except Exception:
            report = (
                f"{customer} has {len(feedback_items)} uploaded feedback items across {len(sources)} sources. "
                "Use the feedback timeline below to review each upload and its main themes."
            )

        return CustomerDetailResponse(
            customer=customer,
            report=report,
            feedback_count=len(feedback_items),
            sources=sources,
            churn_level=churn["churn_level"],
            churn_score=churn["churn_score"],
            churn_probability=churn["churn_probability"],
            churn_reasons=churn["churn_reasons"],
            average_sentiment=average_sentiment,
            sentiment_timeline=sentiment_timeline,
            feedback_items=feedback_items,
        )

    def generate(self, customer: str) -> CustomerReportResponse:
        detail = self.get_customer_detail(customer)
        return CustomerReportResponse(
            customer=detail.customer,
            report=detail.report,
            feedback_count=detail.feedback_count,
            sources=detail.sources,
        )
