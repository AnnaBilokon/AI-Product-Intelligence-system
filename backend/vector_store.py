from typing import Any, Dict, List, Optional

import chromadb


class ChromaVectorStore:
    def __init__(self, persist_path: str, collection_name: str) -> None:
        self.persist_path = persist_path
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(path=self.persist_path)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name)

    def add_documents(
        self,
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: List[str],
    ) -> None:
        if not documents:
            return

        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

    def search(
        self,
        embedding: List[float],
        top_k: int = 6,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if self.collection.count() == 0:
            return []

        results = self.collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
            where=filters or None,
            include=["documents", "metadatas", "distances"],
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        matches: List[Dict[str, Any]] = []
        for document, metadata, distance in zip(documents, metadatas, distances):
            matches.append(
                {
                    "text": document,
                    "metadata": metadata or {},
                    "distance": distance,
                }
            )

        return matches

    def get_documents(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if self.collection.count() == 0:
            return []

        results = self.collection.get(where=filters or None, include=[
                                      "documents", "metadatas"])
        documents = results.get("documents", [])
        metadatas = results.get("metadatas", [])
        ids = results.get("ids", [])

        return [
            {
                "id": document_id,
                "text": document,
                "metadata": metadata or {},
            }
            for document_id, document, metadata in zip(ids, documents, metadatas)
        ]

    def get_stats(self) -> Dict[str, Any]:
        total_chunks = self.collection.count()
        rows = self.get_documents()

        customers = sorted({row["metadata"].get("customer", "")
                           for row in rows if row["metadata"].get("customer")})
        sources = sorted({row["metadata"].get("source", "")
                         for row in rows if row["metadata"].get("source")})
        feedback_ids = {row["metadata"].get(
            "feedback_id") for row in rows if row["metadata"].get("feedback_id")}

        return {
            "total_chunks": total_chunks,
            "total_feedback_entries": len(feedback_ids),
            "customers": customers,
            "sources": sources,
            "collection_name": self.collection_name,
        }

    def clear_collection(self) -> int:
        cleared_chunks = self.collection.count()
        self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name)
        return cleared_chunks
