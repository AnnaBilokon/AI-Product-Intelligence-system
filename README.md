# AI Product Insights

AI Product Insights is a full-stack product intelligence application for collecting customer feedback, storing it in a local vector database, and generating AI-assisted product insights and customer reports.

The project uses a FastAPI backend for ingestion, retrieval, and analysis, and a Next.js 14 frontend for the dashboard experience.

## What It Does

- Ingests customer feedback from TXT, CSV, PDF, and manual text input
- Chunks and embeds feedback using OpenAI embeddings
- Stores embedded chunks in a persistent local ChromaDB collection
- Retrieves relevant feedback context for analysis workflows
- Generates product insights such as pain points, feature requests, themes, and opportunities
- Produces customer-specific intelligence reports in a dashboard UI

## Tech Stack

### Backend

- Python
- FastAPI
- Pydantic
- OpenAI
- ChromaDB
- pandas
- pypdf
- python-dotenv
- tiktoken

### Frontend

- Next.js 14 App Router
- React
- TypeScript
- Tailwind CSS

## Project Structure

```text
AI Product Intelligence system/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── models.py
│   ├── prompts.py
│   ├── vector_store.py
│   ├── rag.py
│   ├── feedback_parser.py
│   ├── feedback_service.py
│   ├── analysis.py
│   ├── analysis_service.py
│   ├── customer_service.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── README.md
└── .gitignore
```

## How It Works

1. Feedback is uploaded or pasted into the system.
2. The backend parses raw inputs into normalized feedback entries.
3. Entries are chunked into overlapping token-aware segments.
4. OpenAI embeddings are generated for each chunk.
5. Chunks and metadata are stored in ChromaDB.
6. Analysis and customer-report requests retrieve relevant context.
7. OpenAI generates summaries shown in the dashboard.

## Local Setup

### 1. Start the Backend

```powershell
cd "c:\projects\AI Product Intelligence system\backend"
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload
```

Backend URLs:

- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`

Set the OpenAI key in `backend/.env`:

```env
OPENAI_API_KEY=
```

### 2. Start the Frontend

```powershell
cd "c:\projects\AI Product Intelligence system\frontend"
npm install
copy .env.local.example .env.local
npm run dev
```

Frontend URL:

- Dashboard: `http://localhost:3000`

Set the frontend API URL in `frontend/.env.local` if needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Main Backend Routes

- `GET /`
- `GET /health`
- `POST /feedback/upload`
- `POST /analysis/run`
- `POST /customer/report`
- `GET /stats`
- `POST /clear`

## Frontend Pages

- `/` overview dashboard
- `/feedback` feedback upload and manual entry
- `/insights` product insight generation
- `/customers` customer intelligence reporting

## Example Workflow

1. Start the backend and frontend.
2. Open `http://localhost:3000`.
3. Go to the feedback page and upload a TXT, CSV, or PDF file, or paste manual notes.
4. Open the insights page and run an analysis query.
5. Open the customers page and generate a customer report.

## Notes

- ChromaDB data is persisted locally under the backend directory.
- The frontend stores recent upload and insight history in localStorage.
- If the backend is not running, the frontend will still open but API-dependent sections will show unavailable states.
- Keep live secrets out of `.env.example`. Put real values only in `.env` and `.env.local`.

## Additional Documentation

- [backend/README.md](backend/README.md)
- [backend/DEVELOPER_GUIDE.md](backend/DEVELOPER_GUIDE.md)
- [backend/API_TESTING.md](backend/API_TESTING.md)
- [backend/RAG_ARCHITECTURE.md](backend/RAG_ARCHITECTURE.md)
- [frontend/README.md](frontend/README.md)
