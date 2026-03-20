from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

import tiktoken
from openai import OpenAI

from config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    EMBEDDING_BATCH_SIZE,
    MAX_CONTEXT_CHUNKS,
    OPENAI_API_KEY,
    OPENAI_EMBEDDING_MODEL,
)
from models import FeedbackChunk, FeedbackEntry
from vector_store import ChromaVectorStore


class FeedbackRAG:
    def __init__(self, vector_store: ChromaVectorStore) -> None:
        self.vector_store = vector_store
        self.client = OpenAI(
            api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.encoding = self._get_encoding()

    def _get_encoding(self):
        try:
            return tiktoken.encoding_for_model(OPENAI_EMBEDDING_MODEL)
        except KeyError:
            return tiktoken.get_encoding("cl100k_base")

    def _require_client(self) -> OpenAI:
        if self.client is None:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        return self.client

    def _token_chunks(self, text: str) -> List[str]:
        tokens = self.encoding.encode(text)
        if not tokens:
            return []

        step = max(1, CHUNK_SIZE - CHUNK_OVERLAP)
        chunks: List[str] = []

        for start in range(0, len(tokens), step):
            end = min(start + CHUNK_SIZE, len(tokens))
            chunk_text = self.encoding.decode(tokens[start:end]).strip()
            if chunk_text:
                chunks.append(chunk_text)
            if end >= len(tokens):
                break

        return chunks

    def build_chunks(self, entries: Iterable[FeedbackEntry]) -> List[FeedbackChunk]:
        chunks: List[FeedbackChunk] = []

        for entry in entries:
            for chunk_index, chunk_text in enumerate(self._token_chunks(entry.text)):
                token_count = len(self.encoding.encode(chunk_text))
                chunks.append(
                    FeedbackChunk(
                        chunk_id=f"{entry.id}_chunk_{chunk_index}",
                        feedback_id=entry.id,
                        customer=entry.customer,
                        source=entry.source,
                        type=entry.type,
                        date=entry.date,
                        chunk_index=chunk_index,
                        text=chunk_text,
                        token_count=token_count,
                    )
                )

        return chunks

    def _embed_texts(self, texts: List[str]) -> List[List[float]]:
        client = self._require_client()
        embeddings: List[List[float]] = []

        for start in range(0, len(texts), EMBEDDING_BATCH_SIZE):
            batch = texts[start: start + EMBEDDING_BATCH_SIZE]
            response = client.embeddings.create(
                model=OPENAI_EMBEDDING_MODEL, input=batch)
            embeddings.extend(item.embedding for item in response.data)

        return embeddings

    def ingest(self, entries: List[FeedbackEntry]) -> Dict[str, int]:
        chunks = self.build_chunks(entries)
        if not chunks:
            return {"entries": len(entries), "chunks": 0}

        chunk_texts = [chunk.text for chunk in chunks]
        embeddings = self._embed_texts(chunk_texts)
        metadatas = [
            {
                "feedback_id": chunk.feedback_id,
                "customer": chunk.customer,
                "source": chunk.source,
                "type": chunk.type,
                "date": chunk.date or "",
                "chunk_index": chunk.chunk_index,
                "token_count": chunk.token_count,
            }
            for chunk in chunks
        ]
        ids = [chunk.chunk_id for chunk in chunks]

        self.vector_store.add_documents(
            documents=chunk_texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

        return {"entries": len(entries), "chunks": len(chunks)}

    def retrieve_context(
        self,
        query: str,
        customer: Optional[str] = None,
        source: Optional[str] = None,
        top_k: int = MAX_CONTEXT_CHUNKS,
    ) -> Dict[str, Any]:
        query_embedding = self._embed_texts([query])[0]

        filters: Dict[str, Any] = {}
        if customer:
            filters["customer"] = customer
        if source:
            filters["source"] = source

        matches = self.vector_store.search(
            query_embedding, top_k=top_k, filters=filters or None)

        context_blocks = []
        for index, match in enumerate(matches, start=1):
            metadata = match["metadata"]
            context_blocks.append(
                "\n".join(
                    [
                        f"[Chunk {index}]",
                        f"Customer: {metadata.get('customer', 'Unknown Customer')}",
                        f"Source: {metadata.get('source', 'unknown')}",
                        f"Type: {metadata.get('type', 'general')}",
                        f"Date: {metadata.get('date', '')}",
                        f"Text: {match['text']}",
                    ]
                )
            )

        return {
            "records": matches,
            "context": "\n\n".join(context_blocks),
        }

    def get_customer_feedback(self, customer: str) -> List[Dict[str, Any]]:
        rows = self.vector_store.get_documents(filters={"customer": customer})
        return sorted(rows, key=lambda item: (item["metadata"].get("date", ""), item["metadata"].get("chunk_index", 0)))

    def get_stats(self) -> Dict[str, Any]:
        return self.vector_store.get_stats()

    def clear(self) -> int:
        return self.vector_store.clear_collection()
