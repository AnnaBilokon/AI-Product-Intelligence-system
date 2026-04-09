from __future__ import annotations

from collections import Counter
from typing import Dict, Iterable, Optional

from models import FeedbackEntry


_TYPE_KEYWORDS = {
    "bug": (
        "bug",
        "broken",
        "crash",
        "crashes",
        "crashed",
        "error",
        "failing",
        "fails",
        "failure",
        "not working",
        "doesn't work",
        "does not work",
        "issue",
        "glitch",
        "defect",
    ),
    "feature_request": (
        "feature request",
        "would like",
        "wish",
        "please add",
        "it would be great",
        "missing",
        "need",
        "needs",
        "ability to",
        "support for",
        "add a",
        "add an",
    ),
    "complaint": (
        "frustrated",
        "annoying",
        "disappointed",
        "slow",
        "difficult",
        "hard to",
        "confusing",
        "unusable",
        "painful",
        "bad experience",
        "hate",
        "too long",
        "too many",
    ),
    "praise": (
        "love",
        "great",
        "excellent",
        "helpful",
        "amazing",
        "fantastic",
        "intuitive",
        "easy to use",
        "works well",
        "awesome",
    ),
    "question": (
        "how do",
        "how can",
        "can i",
        "is there",
        "are there",
        "why does",
        "what is",
        "where can",
        "when will",
    ),
}

_TYPE_PRIORITY = (
    "bug",
    "feature_request",
    "complaint",
    "praise",
    "question",
    "general",
)


def suggest_feedback_type(text: str) -> str:
    normalized = " ".join(text.lower().split())
    if not normalized:
        return "general"

    scores = {feedback_type: 0 for feedback_type in _TYPE_PRIORITY}

    for feedback_type, keywords in _TYPE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in normalized:
                scores[feedback_type] += 1

    if normalized.endswith("?"):
        scores["question"] += 2

    if scores["bug"] > 0 and any(
        phrase in normalized for phrase in ("not working", "broken", "error", "crash")
    ):
        scores["bug"] += 2

    if scores["feature_request"] > 0 and any(
        phrase in normalized for phrase in ("would like", "please add", "missing", "need")
    ):
        scores["feature_request"] += 1

    best_type = max(
        _TYPE_PRIORITY, key=lambda feedback_type: scores[feedback_type])
    return best_type if scores[best_type] > 0 else "general"


def summarize_feedback_types(entries: Iterable[FeedbackEntry]) -> tuple[Optional[str], Dict[str, int]]:
    counts = Counter(entry.type for entry in entries if entry.type)
    if not counts:
        return None, {}

    suggested_type = max(
        counts,
        key=lambda feedback_type: (
            counts[feedback_type], -_TYPE_PRIORITY.index(feedback_type)),
    )
    ordered_counts = {
        feedback_type: counts[feedback_type]
        for feedback_type in _TYPE_PRIORITY
        if counts.get(feedback_type)
    }
    return suggested_type, ordered_counts
