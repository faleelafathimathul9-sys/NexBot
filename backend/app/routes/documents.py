import os
import uuid

from flask import Blueprint, request, jsonify, current_app, g
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Business, Chatbot, KnowledgeDocument, KnowledgeChunk
from app.routes.auth import token_required
from app.services.knowledge_service import KnowledgeService


documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")


@documents_bp.route("/chatbots/<int:chatbot_id>/upload", methods=["POST"])
@token_required
def upload_document(chatbot_id):

    chatbot = (
        Chatbot.query
        .join(Business)
        .filter(
            Chatbot.id == chatbot_id,
            Business.owner_id == g.current_user.id
        )
        .first()
    )

    if not chatbot:
        return jsonify({"error": "Chatbot not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    original_filename = secure_filename(file.filename)

    if not original_filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    file_path = os.path.join(upload_folder, unique_filename)

    try:
        file.save(file_path)

        result = KnowledgeService.process_document(file_path)

        if result["status"] != "processed":
            os.remove(file_path)
            return jsonify({
                "error": "No readable text found in this PDF. Scanned PDFs need OCR."
            }), 422

        document = KnowledgeDocument(
            filename=original_filename,
            file_path=file_path,
            extracted_text=result["extracted_text"],
            processing_status="processed",
            chatbot_id=chatbot.id
        )

        db.session.add(document)
        db.session.flush()

        for index, chunk_text in enumerate(result["chunks"]):
            chunk = KnowledgeChunk(
                content=chunk_text,
                chunk_index=index,
                document_id=document.id,
                chatbot_id=chatbot.id
            )

            db.session.add(chunk)

        db.session.commit()

        return jsonify({
            "message": "Document uploaded and processed successfully",
            "document_id": document.id,
            "filename": document.filename,
            "total_chunks": result["total_chunks"],
            "status": document.processing_status
        }), 201

    except Exception as error:
        db.session.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        return jsonify({
            "error": f"Document processing failed: {str(error)}"
        }), 500