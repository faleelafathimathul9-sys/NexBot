import re
from pathlib import Path
from pypdf import PdfReader


class KnowledgeService:

    # Extract text from PDF documents
    @staticmethod
    def extract_pdf_text(file_path):

        try:
            reader = PdfReader(file_path)

            extracted_pages = []

            for page_number, page in enumerate(reader.pages, start=1):

                text = page.extract_text()

                if text and text.strip():
                    extracted_pages.append(
                        f"[Page {page_number}]\n{text.strip()}"
                    )

            return "\n\n".join(extracted_pages)

        except Exception as error:
            raise ValueError(
                f"Unable to read PDF: {str(error)}"
            )

    # Clean extracted text
    @staticmethod
    def clean_text(text):

        text = re.sub(r"\s+", " ", text)

        return text.strip()

    # Divide documents into smaller chunks
    @staticmethod
    def split_into_chunks(text, chunk_size=800, overlap=120):

        if not text:
            return []

        words = text.split()

        chunks = []

        start = 0

        while start < len(words):

            end = start + chunk_size

            chunk = " ".join(words[start:end])

            if chunk.strip():
                chunks.append(chunk.strip())

            start += chunk_size - overlap

        return chunks

    # Process an uploaded document
    @classmethod
    def process_document(cls, file_path):

        extracted_text = cls.extract_pdf_text(file_path)

        cleaned_text = cls.clean_text(extracted_text)

        chunks = cls.split_into_chunks(cleaned_text)

        return {
            "extracted_text": cleaned_text,
            "chunks": chunks,
            "total_chunks": len(chunks),
            "status": (
                "processed" if chunks else "no_readable_text"
            )
        }