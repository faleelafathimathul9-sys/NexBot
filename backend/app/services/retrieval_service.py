from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models import KnowledgeChunk


class RetrievalService:

    @staticmethod
    def retrieve_relevant_chunks(chatbot_id, question, top_k=3):

        chunks = KnowledgeChunk.query.filter_by(
            chatbot_id=chatbot_id
        ).all()

        if not chunks or not question.strip():
            return []

        documents = [chunk.content for chunk in chunks]

        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2)
        )

        try:
            document_vectors = vectorizer.fit_transform(documents)
            question_vector = vectorizer.transform([question])

            similarities = cosine_similarity(
                question_vector,
                document_vectors
            )[0]

        except ValueError:
            return []

        ranked_results = sorted(
            zip(chunks, similarities),
            key=lambda item: item[1],
            reverse=True
        )

        results = []

        for chunk, score in ranked_results[:top_k]:

            if score > 0:
                results.append({
                    "content": chunk.content,
                    "score": round(float(score), 4),
                    "document_id": chunk.document_id
                })

        return results

    @staticmethod
    def build_context(results):

        if not results:
            return "No relevant information was found in the uploaded documents."

        context = []

        for index, result in enumerate(results, start=1):
            context.append(
                f"Information {index}:\n{result['content']}"
            )

        return "\n\n".join(context)