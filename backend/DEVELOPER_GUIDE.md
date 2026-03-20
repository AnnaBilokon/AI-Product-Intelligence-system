# Developer Guide

## Architecture

The backend is split into small modules so the workflow is easy to follow:

- `main.py` wires the API routes to the service layer
- `feedback_service.py` accepts uploads and manual input
- `feedback_parser.py` handles raw TXT, CSV, and PDF parsing
- `rag.py` chunks text, embeds chunks, and retrieves matching context
- `vector_store.py` isolates ChromaDB persistence
- `analysis_service.py` runs product insight analysis
- `customer_service.py` generates customer-specific reports
- `analysis.py` provides a simple fallback analysis path

## Data Flow

1. The upload endpoint receives files and optional manual text.
2. The parser layer normalizes content into `FeedbackEntry` records.
3. The RAG layer chunks each entry with token overlap.
4. OpenAI embeddings are created for each chunk.
5. Chunks and metadata are stored in ChromaDB.
6. Analysis endpoints retrieve relevant context and generate responses.

## Extension Points

- Add richer CSV column mapping in `feedback_parser.py`
- Add authentication in `main.py`
- Add score or sentiment metadata during ingestion
- Add background processing if uploads become large

## Running Locally

```bash
uvicorn main:app --reload
```

Use the OpenAPI docs to inspect payloads and response models.
