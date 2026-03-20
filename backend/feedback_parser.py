from __future__ import annotations

import io
from typing import Dict, List, Optional
from uuid import uuid4

import pandas as pd
from pypdf import PdfReader

from config import normalize_feedback_type
from models import FeedbackEntry


TEXT_COLUMN_CANDIDATES = [
    "text",
    "feedback",
    "comment",
    "comments",
    "message",
    "notes",
    "review",
    "content",
]


def _build_entry(
    text: str,
    customer: Optional[str],
    source: Optional[str],
    feedback_type: Optional[str],
    date: Optional[str],
) -> FeedbackEntry:
    return FeedbackEntry(
        id=str(uuid4()),
        customer=(customer or "Unknown Customer").strip(),
        source=(source or "manual").strip(),
        type=normalize_feedback_type(feedback_type),
        date=(date or "").strip() or None,
        text=text.strip(),
    )


def _split_segments(text: str) -> List[str]:
    parts = [part.strip() for part in text.replace(
        "\r\n", "\n").split("\n\n") if part.strip()]
    return parts or ([text.strip()] if text.strip() else [])


def parse_txt_bytes(content: bytes, defaults: Dict[str, Optional[str]], source_name: str) -> List[FeedbackEntry]:
    text = content.decode("utf-8", errors="ignore")
    return [
        _build_entry(segment, defaults.get("customer"), source_name,
                     defaults.get("feedback_type"), defaults.get("date"))
        for segment in _split_segments(text)
    ]


def parse_manual_text(text: str, defaults: Dict[str, Optional[str]]) -> List[FeedbackEntry]:
    return [
        _build_entry(segment, defaults.get("customer"), defaults.get(
            "source"), defaults.get("feedback_type"), defaults.get("date"))
        for segment in _split_segments(text)
    ]


def parse_pdf_bytes(content: bytes, defaults: Dict[str, Optional[str]], source_name: str) -> List[FeedbackEntry]:
    reader = PdfReader(io.BytesIO(content))
    page_text = []
    for page in reader.pages:
        extracted = (page.extract_text() or "").strip()
        if extracted:
            page_text.append(extracted)

    combined_text = "\n\n".join(page_text)
    if not combined_text:
        return []

    return [
        _build_entry(segment, defaults.get("customer"), source_name,
                     defaults.get("feedback_type"), defaults.get("date"))
        for segment in _split_segments(combined_text)
    ]


def parse_csv_bytes(content: bytes, defaults: Dict[str, Optional[str]], source_name: str) -> List[FeedbackEntry]:
    dataframe = pd.read_csv(io.BytesIO(content))
    dataframe.columns = [str(column).strip().lower()
                         for column in dataframe.columns]

    entries: List[FeedbackEntry] = []
    metadata_columns = {"customer", "source", "type", "date"}
    available_text_columns = [
        column for column in TEXT_COLUMN_CANDIDATES if column in dataframe.columns]

    for _, row in dataframe.fillna("").iterrows():
        if available_text_columns:
            text = "\n".join(str(row[column]).strip(
            ) for column in available_text_columns if str(row[column]).strip())
        else:
            text_parts = [
                f"{column}: {str(value).strip()}"
                for column, value in row.items()
                if column not in metadata_columns and str(value).strip()
            ]
            text = "\n".join(text_parts)

        if not text.strip():
            continue

        entries.append(
            _build_entry(
                text=text,
                customer=str(row.get("customer") or defaults.get(
                    "customer") or "Unknown Customer"),
                source=str(row.get("source") or source_name),
                feedback_type=str(row.get("type") or defaults.get(
                    "feedback_type") or "general"),
                date=str(row.get("date") or defaults.get(
                    "date") or "") or None,
            )
        )

    return entries
