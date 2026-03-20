from __future__ import annotations

from collections import Counter
from typing import Dict, Iterable, List


STOP_WORDS = {
    "the",
    "and",
    "for",
    "that",
    "with",
    "this",
    "from",
    "have",
    "they",
    "were",
    "about",
    "their",
    "into",
    "when",
    "your",
}


def keyword_summary(texts: Iterable[str], limit: int = 8) -> List[str]:
    counter: Counter[str] = Counter()

    for text in texts:
        for word in text.lower().replace("\n", " ").split():
            cleaned = "".join(
                character for character in word if character.isalnum())
            if len(cleaned) > 3 and cleaned not in STOP_WORDS:
                counter[cleaned] += 1

    return [keyword for keyword, _ in counter.most_common(limit)]


def simple_analysis(texts: Iterable[str]) -> Dict[str, str]:
    keywords = keyword_summary(texts)
    summary = ", ".join(
        keywords) if keywords else "No strong patterns detected."

    return {
        "pain_points": f"Fallback summary based on repeated keywords: {summary}",
        "feature_requests": f"Likely requested areas: {summary}",
        "themes": f"Recurring themes appear around: {summary}",
        "opportunities": f"Potential opportunities to investigate: {summary}",
    }
