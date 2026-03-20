# RAG Architecture

## Overview

The backend uses a straightforward retrieval-augmented generation flow:

1. Parse uploaded or manual feedback into structured entries.
2. Split entry text into overlapping token-aware chunks.
3. Generate OpenAI embeddings for every chunk.
4. Store chunks plus metadata in a local ChromaDB collection.
5. Retrieve the most relevant chunks for analysis or customer reporting.
6. Feed the retrieved context into an OpenAI chat model.

## Metadata Stored Per Chunk

- `feedback_id`
- `customer`
- `source`
- `type`
- `date`
- `chunk_index`
- `token_count`

## Retrieval Behavior

- Analysis uses semantic search over chunk embeddings.
- Analysis can be filtered by `customer` and `source`.
- Customer reports pull all stored chunks for the selected customer.

## Why Persistent ChromaDB

`PersistentClient` keeps the vector store local and durable between restarts, which is enough for a demo or local development workflow.

## Next Improvements

- Add deduplication for repeated uploads
- Add reranking for higher quality context selection
- Add feedback-level summaries alongside chunk storage
- Add background jobs for large batch ingestion
