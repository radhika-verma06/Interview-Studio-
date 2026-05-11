import math
import re
import hashlib
from collections import Counter
from typing import Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models


STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
    "how", "i", "in", "is", "it", "of", "on", "or", "our", "that", "the", "their", "this",
    "to", "was", "we", "were", "what", "when", "where", "which", "who", "with", "would",
    "you", "your",
}

VECTOR_SIZE = 384


def _tokens(text: str) -> List[str]:
    return [
        token
        for token in re.findall(r"[a-zA-Z][a-zA-Z0-9_+#.-]{1,}", text.lower())
        if token not in STOPWORDS
    ]


def _chunk_text(content: str, max_words: int = 140, overlap: int = 30) -> List[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    if not paragraphs:
        paragraphs = [content.strip()]

    chunks: List[str] = []
    current: List[str] = []

    for paragraph in paragraphs:
        words = paragraph.split()
        if len(current) + len(words) <= max_words:
            current.extend(words)
            continue

        if current:
            chunks.append(" ".join(current))
        current = words[-max_words:]

        while len(current) > max_words:
            chunks.append(" ".join(current[:max_words]))
            current = current[max_words - overlap :]

    if current:
        chunks.append(" ".join(current))

    normalized = []
    seen = set()
    for chunk in chunks:
        compact = " ".join(chunk.split())
        if compact and compact not in seen:
            normalized.append(compact)
            seen.add(compact)
    return normalized


def _hash_index(feature: str) -> int:
    digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=4).digest()
    return int.from_bytes(digest, "big") % VECTOR_SIZE


def _hashed_vector(text: str) -> Dict[int, float]:
    tokens = _tokens(text)
    if not tokens:
        return {}

    vector: Counter[int] = Counter()
    for token in tokens:
        vector[_hash_index(f"tok:{token}")] += 1.0
        if len(token) >= 6:
            for index in range(max(1, len(token) - 3)):
                vector[_hash_index(f"chr:{token[index:index + 4]}")] += 0.25

    for left, right in zip(tokens, tokens[1:]):
        vector[_hash_index(f"bigram:{left}_{right}")] += 0.75

    length = math.sqrt(sum(value * value for value in vector.values()))
    if not length:
        return {}
    return {index: value / length for index, value in vector.items()}


def _cosine_sparse(left: Dict[int, float], right: Dict[int, float]) -> float:
    if not left or not right:
        return 0.0
    if len(left) > len(right):
        left, right = right, left
    return sum(value * right.get(index, 0.0) for index, value in left.items())


class RAGService:
    def add_document(
        self,
        db: Session,
        *,
        user_id: Optional[int],
        session_id: Optional[str],
        title: str,
        source_type: str,
        content: str,
    ) -> models.KnowledgeDocument:
        clean_content = content.strip()
        if len(clean_content) < 40:
            raise ValueError("Knowledge document is too short to retrieve from.")

        document = models.KnowledgeDocument(
            user_id=user_id,
            session_id=session_id,
            title=title.strip() or "Interview context",
            source_type=source_type.strip() or "notes",
            content=clean_content,
        )
        db.add(document)
        db.flush()

        for index, chunk in enumerate(_chunk_text(clean_content)):
            db.add(
                models.KnowledgeChunk(
                    document_id=document.id,
                    session_id=session_id,
                    chunk_index=index,
                    content=chunk,
                    token_count=len(_tokens(chunk)),
                )
            )

        db.commit()
        db.refresh(document)
        return document

    def retrieve_context(
        self,
        db: Session,
        *,
        session_id: Optional[str],
        user_id: Optional[int],
        query: str,
        limit: int = 5,
    ) -> List[Dict[str, str]]:
        query_tokens = _tokens(query)
        if not query_tokens:
            return []

        chunks_query = db.query(models.KnowledgeChunk, models.KnowledgeDocument).join(
            models.KnowledgeDocument,
            models.KnowledgeChunk.document_id == models.KnowledgeDocument.id,
        )

        if session_id:
            filters = [models.KnowledgeChunk.session_id == session_id]
            if user_id:
                filters.append(models.KnowledgeDocument.user_id == user_id)
            chunks_query = chunks_query.filter(or_(*filters))
        elif user_id:
            chunks_query = chunks_query.filter(models.KnowledgeDocument.user_id == user_id)

        rows = chunks_query.all()
        if not rows:
            return []

        document_frequency: Counter[str] = Counter()
        chunk_tokens: Dict[int, List[str]] = {}
        chunk_vectors: Dict[int, Dict[int, float]] = {}
        for chunk, _document in rows:
            tokens = _tokens(chunk.content)
            chunk_tokens[chunk.id] = tokens
            chunk_vectors[chunk.id] = _hashed_vector(chunk.content)
            document_frequency.update(set(tokens))

        scored = []
        total_docs = len(rows)
        query_counter = Counter(query_tokens)
        query_vector = _hashed_vector(query)

        for chunk, document in rows:
            tokens = chunk_tokens[chunk.id]
            if not tokens:
                continue
            token_counter = Counter(tokens)
            lexical_score = 0.0
            for token, query_weight in query_counter.items():
                if token not in token_counter:
                    continue
                tf = token_counter[token] / len(tokens)
                idf = math.log((1 + total_docs) / (1 + document_frequency[token])) + 1
                lexical_score += tf * idf * query_weight

            phrase_bonus = 0.0
            lower_content = chunk.content.lower()
            for token in query_counter:
                if token in lower_content:
                    phrase_bonus += 0.03

            title_text = f"{document.title} {document.source_type}".lower()
            source_bonus = 0.12 if any(token in title_text for token in query_counter) else 0.0
            semantic_score = _cosine_sparse(query_vector, chunk_vectors[chunk.id])

            score = (lexical_score * 3.0) + (semantic_score * 0.85) + phrase_bonus + source_bonus

            if score > 0.035:
                scored.append((score, chunk, document))

        scored.sort(key=lambda item: item[0], reverse=True)

        return [
            {
                "title": document.title,
                "source_type": document.source_type,
                "content": chunk.content,
            }
            for score, chunk, document in scored[:limit]
        ]


rag_service = RAGService()
