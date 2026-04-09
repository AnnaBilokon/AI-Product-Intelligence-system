from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any, Dict, List

from config import is_openai_configured
from models import (
    ChurnRiskCustomer,
    OverviewSignal,
    ProductOverviewResponse,
    TechnicalMetrics,
)
from rag import FeedbackRAG


ISSUE_PATTERNS = {
    "Editor performance and reliability": [
        "slow",
        "lag",
        "freeze",
        "crash",
        "timeout",
        "loading",
        "stuck",
        "save failed",
        "autosave",
        "sync",
    ],
    "Publishing and formatting friction": [
        "publish",
        "format",
        "formatting",
        "layout",
        "export",
        "markdown",
        "render",
        "table of contents",
        "toc",
    ],
    "Collaboration and review workflow": [
        "comment",
        "review",
        "approval",
        "approve",
        "mention",
        "collabor",
        "track changes",
    ],
    "Navigation and findability": [
        "search",
        "find",
        "navigation",
        "folder",
        "organize",
        "structure",
    ],
    "Permissions and access control": [
        "permission",
        "access",
        "role",
        "admin",
        "share",
        "invite",
    ],
}

FEATURE_PATTERNS = {
    "Stronger collaboration controls": [
        "approve",
        "approval",
        "workflow",
        "review step",
        "comment resolution",
        "assign",
    ],
    "Smarter publishing and templates": [
        "template",
        "publishing workflow",
        "publish",
        "export",
        "formatting presets",
        "brand",
    ],
    "Better search and organization": [
        "search",
        "filter",
        "taxonomy",
        "folder",
        "navigation",
        "findability",
    ],
    "Reliability and performance improvements": [
        "faster",
        "performance",
        "autosave",
        "reliable",
        "offline",
        "sync",
    ],
    "Admin and permissions tooling": [
        "permission",
        "role",
        "admin",
        "access control",
        "audit",
    ],
}

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


class ProductOverviewService:
    def __init__(self, rag: FeedbackRAG) -> None:
        self.rag = rag

    def _rebuild_feedback_entries(self) -> List[Dict[str, Any]]:
        rows = self.rag.vector_store.get_documents()
        grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for row in rows:
            feedback_id = row["metadata"].get("feedback_id") or row["id"]
            grouped[feedback_id].append(row)

        entries: List[Dict[str, Any]] = []
        for feedback_id, chunks in grouped.items():
            ordered_chunks = sorted(
                chunks,
                key=lambda item: item["metadata"].get("chunk_index", 0),
            )
            metadata = ordered_chunks[0]["metadata"]
            text = " ".join(chunk["text"].strip()
                            for chunk in ordered_chunks).strip()

            entries.append(
                {
                    "feedback_id": feedback_id,
                    "customer": metadata.get("customer", "Unknown Customer"),
                    "source": metadata.get("source", "unknown"),
                    "type": metadata.get("type", "general"),
                    "date": metadata.get("date", ""),
                    "text": text,
                }
            )

        return entries

    def _excerpt(self, text: str, limit: int = 150) -> str:
        cleaned = " ".join(text.split())
        if len(cleaned) <= limit:
            return cleaned
        return f"{cleaned[:limit].rstrip()}..."

    def _matched_categories(self, text: str, catalog: Dict[str, List[str]]) -> List[str]:
        lowered = text.lower()
        return [
            category
            for category, keywords in catalog.items()
            if any(keyword in lowered for keyword in keywords)
        ]

    def _build_signal_list(
        self,
        entries: List[Dict[str, Any]],
        catalog: Dict[str, List[str]],
    ) -> List[OverviewSignal]:
        counts: Counter[str] = Counter()
        evidence: Dict[str, List[str]] = defaultdict(list)

        for entry in entries:
            matched = set(self._matched_categories(entry["text"], catalog))
            if not matched:
                continue

            for category in matched:
                counts[category] += 1
                if len(evidence[category]) < 2:
                    evidence[category].append(
                        f"{entry['customer']}: {self._excerpt(entry['text'])}"
                    )

        signals: List[OverviewSignal] = []
        for category, count in counts.most_common(4):
            signals.append(
                OverviewSignal(
                    name=category,
                    count=count,
                    summary=f"Appears in {count} feedback entries across the current dataset.",
                    evidence=evidence[category],
                )
            )

        return signals

    def _score_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        lowered = entry["text"].lower()
        score = 0
        reasons: List[str] = []

        if entry["type"] in {"complaint", "bug"}:
            score += 1

        for reason, weight, keywords in CHURN_PATTERNS:
            if any(keyword in lowered for keyword in keywords):
                score += weight
                reasons.append(reason)

        return {
            "score": score,
            "reasons": reasons,
            "evidence": self._excerpt(entry["text"]),
        }

    def _build_churn_list(self, entries: List[Dict[str, Any]]) -> List[ChurnRiskCustomer]:
        grouped: Dict[str, Dict[str, Any]] = defaultdict(
            lambda: {
                "score": 0,
                "reasons": Counter(),
                "sources": set(),
                "best_evidence": "",
                "best_score": 0,
            }
        )

        for entry in entries:
            entry_score = self._score_entry(entry)
            customer = entry["customer"]
            grouped[customer]["score"] += entry_score["score"]
            grouped[customer]["sources"].add(entry["source"])
            for reason in entry_score["reasons"]:
                grouped[customer]["reasons"][reason] += 1
            if entry_score["score"] > grouped[customer]["best_score"]:
                grouped[customer]["best_score"] = entry_score["score"]
                grouped[customer]["best_evidence"] = entry_score["evidence"]

        results: List[ChurnRiskCustomer] = []
        for customer, data in grouped.items():
            total_score = data["score"]
            if total_score < 3:
                continue

            risk = "medium"
            if total_score >= 8:
                risk = "high"

            results.append(
                ChurnRiskCustomer(
                    customer=customer,
                    risk=risk,
                    score=total_score,
                    reasons=[reason for reason,
                             _ in data["reasons"].most_common(3)],
                    evidence=data["best_evidence"] or "No specific evidence available.",
                    sources=sorted(data["sources"]),
                )
            )

        results.sort(key=lambda item: (
            item.risk != "high", -item.score, item.customer))
        return results[:5]

    def get_overview(self) -> ProductOverviewResponse:
        stats = self.rag.get_stats()
        entries = self._rebuild_feedback_entries()
        pain_points = self._build_signal_list(entries, ISSUE_PATTERNS)
        feature_requests = self._build_signal_list(entries, FEATURE_PATTERNS)
        churn_risks = self._build_churn_list(entries)

        if not entries:
            headline = "No feedback has been ingested yet. Upload customer feedback to generate product signals."
        else:
            lead_problem = pain_points[0].name if pain_points else "general workflow friction"
            at_risk = len(churn_risks)
            headline = (
                f"The strongest signal right now is {lead_problem.lower()}, and "
                f"{at_risk} customer accounts show medium or high churn risk."
            )

        technical_metrics = TechnicalMetrics(
            total_chunks=stats["total_chunks"],
            total_feedback_entries=stats["total_feedback_entries"],
            customers_count=len(stats["customers"]),
            sources_count=len(stats["sources"]),
            collection_name=stats["collection_name"],
            openai_configured=is_openai_configured(),
        )

        return ProductOverviewResponse(
            summary_headline=headline,
            pain_points=pain_points,
            feature_requests=feature_requests,
            churn_risks=churn_risks,
            technical_metrics=technical_metrics,
        )
