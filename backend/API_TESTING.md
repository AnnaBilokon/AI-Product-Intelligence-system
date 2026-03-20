# API Testing

## Health Check

```bash
curl http://127.0.0.1:8000/health
```

## Upload Manual Feedback

```bash
curl -X POST http://127.0.0.1:8000/feedback/upload \
  -F "manual_text=The dashboard is slow when loading large exports." \
  -F "customer=Acme" \
  -F "source=interview" \
  -F "feedback_type=complaint" \
  -F "date=2026-03-20"
```

## Upload a CSV File

```bash
curl -X POST http://127.0.0.1:8000/feedback/upload \
  -F "files=@sample-feedback.csv" \
  -F "source=survey"
```

## Run Analysis

```bash
curl -X POST http://127.0.0.1:8000/analysis/run \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"What are the biggest product issues and opportunities?\", \"top_k\": 6}"
```

## Customer Report

```bash
curl -X POST http://127.0.0.1:8000/customer/report \
  -H "Content-Type: application/json" \
  -d "{\"customer\": \"Acme\"}"
```

## Stats and Reset

```bash
curl http://127.0.0.1:8000/stats
curl -X POST http://127.0.0.1:8000/clear
```
