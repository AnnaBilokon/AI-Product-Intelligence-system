from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from fastapi import UploadFile

from config import normalize_feedback_type
from feedback_classifier import suggest_feedback_type
from feedback_parser import parse_csv_bytes, parse_manual_text, parse_pdf_bytes, parse_txt_bytes
from models import FeedbackEntry


class FeedbackIngestionService:
    async def parse_inputs(
        self,
        files: Optional[List[UploadFile]],
        manual_text: Optional[str],
        customer: Optional[str],
        source: Optional[str],
        feedback_type: Optional[str],
        date: Optional[str],
    ) -> List[FeedbackEntry]:
        defaults = {
            "customer": customer,
            "source": source or "manual",
            "feedback_type": normalize_feedback_type(feedback_type),
            "date": date,
        }

        entries: List[FeedbackEntry] = []

        if manual_text and manual_text.strip():
            entries.extend(parse_manual_text(manual_text, defaults))

        for upload in files or []:
            file_content = await upload.read()
            suffix = Path(upload.filename or "").suffix.lower()
            derived_source = source or upload.filename or "upload"

            if suffix == ".txt":
                entries.extend(parse_txt_bytes(
                    file_content, defaults, derived_source))
            elif suffix == ".csv":
                entries.extend(parse_csv_bytes(
                    file_content, defaults, derived_source))
            elif suffix == ".pdf":
                entries.extend(parse_pdf_bytes(
                    file_content, defaults, derived_source))
            else:
                raise ValueError(
                    f"Unsupported file type: {suffix or 'unknown'}")

        if not feedback_type:
            for entry in entries:
                if entry.type == "general":
                    entry.type = suggest_feedback_type(entry.text)

        return entries
