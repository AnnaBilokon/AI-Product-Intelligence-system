# Frontend

The frontend is a Next.js 14 dashboard for uploading customer feedback, running product insight analysis, and generating customer reports.

## Setup

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.

## Pages

- `/` dashboard overview
- `/feedback` upload feedback and manual notes
- `/insights` run analysis against stored feedback
- `/customers` generate customer intelligence reports

## Notes

- The UI saves upload history and recent insight snapshots in `localStorage`.
- The app expects the FastAPI backend to be available before you test full workflows.
