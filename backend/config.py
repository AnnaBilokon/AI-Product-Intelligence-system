import os
from typing import List

from dotenv import load_dotenv

load_dotenv()

APP_TITLE = os.getenv("APP_TITLE", "AI Product Insights API")
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_EMBEDDING_MODEL = os.getenv(
    "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
OPENAI_ANALYSIS_MODEL = os.getenv("OPENAI_ANALYSIS_MODEL", "gpt-4.1-mini")

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
CHROMA_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "feedback_chunks")

ALLOWED_FEEDBACK_TYPES = tuple(
    value.strip()
    for value in os.getenv(
        "ALLOWED_FEEDBACK_TYPES",
        "bug,feature_request,complaint,praise,question,general",
    ).split(",")
    if value.strip()
)

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "700"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))
MAX_CONTEXT_CHUNKS = int(os.getenv("MAX_CONTEXT_CHUNKS", "8"))
EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))

CORS_ORIGINS: List[str] = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]


def is_openai_configured() -> bool:
    return bool(OPENAI_API_KEY)


def normalize_feedback_type(value: str | None) -> str:
    if not value:
        return "general"

    normalized = value.strip().lower().replace(" ", "_")
    if normalized in ALLOWED_FEEDBACK_TYPES:
        return normalized

    return "general"
