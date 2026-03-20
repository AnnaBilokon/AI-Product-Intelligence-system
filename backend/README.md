# Backend

The backend is a FastAPI service that ingests customer feedback, stores embedded chunks in ChromaDB, and generates AI-assisted product insights and customer reports.

## Features

- Upload feedback from TXT, CSV, and PDF files
- Submit manual feedback text from the UI or API
- Chunk and embed feedback with OpenAI
- Store chunks locally in a persistent ChromaDB collection
- Run product insight analysis over retrieved feedback context
- Generate customer intelligence reports for a named account

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set `OPENAI_API_KEY` in `.env`, then run:

```bash
uvicorn main:app --reload
```

## API Routes

- `GET /`
- `GET /health`
- `POST /feedback/upload`
- `POST /analysis/run`
- `POST /customer/report`
- `GET /stats`
- `POST /clear`

## Notes

- ChromaDB persists data under `backend/chroma_db` by default.
- If OpenAI is not configured, ingestion that requires embeddings will fail and analysis falls back to a simple keyword summary where possible.
- Use `http://127.0.0.1:8000/docs` for Swagger UI.
