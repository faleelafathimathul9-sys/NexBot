import os
import uuid
import tempfile
from urllib.parse import quote

import requests

from flask import Blueprint, request, jsonify, current_app, g
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import (
    Business,
    Chatbot,
    KnowledgeDocument,
    KnowledgeChunk
)
from app.routes.auth import token_required
from app.services.knowledge_service import KnowledgeService


documents_bp = Blueprint(
    "documents",
    __name__,
    url_prefix="/api/documents"
)


def get_owned_chatbot(chatbot_id):
    return (
        Chatbot.query
        .join(Business)
        .filter(
            Chatbot.id == chatbot_id,
            Business.owner_id == g.current_user.id
        )
        .first()
    )


def get_storage_details():

    supabase_url = current_app.config.get("SUPABASE_URL")
    service_key = current_app.config.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    bucket = current_app.config.get(
        "SUPABASE_STORAGE_BUCKET"
    )

    if not supabase_url or not service_key or not bucket:
        raise RuntimeError(
            "Supabase Storage is not configured. "
            "Check the Render environment variables."
        )

    return supabase_url, service_key, bucket


def upload_to_storage(file_path, object_path):

    supabase_url, service_key, bucket = get_storage_details()

    encoded_bucket = quote(bucket, safe="")
    encoded_path = quote(object_path, safe="/")

    url = (
        f"{supabase_url}/storage/v1/object/"
        f"{encoded_bucket}/{encoded_path}"
    )

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/pdf",
        "x-upsert": "false"
    }

    with open(file_path, "rb") as pdf_file:

        response = requests.post(
            url,
            headers=headers,
            data=pdf_file,
            timeout=60
        )

    if not response.ok:
        raise RuntimeError(
            f"Supabase upload failed ({response.status_code})."
        )


def delete_from_storage(object_path):

    supabase_url, service_key, bucket = get_storage_details()

    encoded_bucket = quote(bucket, safe="")

    url = (
        f"{supabase_url}/storage/v1/object/"
        f"{encoded_bucket}"
    )

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }

    response = requests.delete(
        url,
        headers=headers,
        json={"prefixes": [object_path]},
        timeout=30
    )

    if not response.ok:
        raise RuntimeError(
            f"Supabase deletion failed ({response.status_code})."
        )


@documents_bp.route(
    "/chatbots/<int:chatbot_id>/upload",
    methods=["POST"]
)
@token_required
def upload_document(chatbot_id):

    chatbot = get_owned_chatbot(chatbot_id)

    if not chatbot:
        return jsonify({"error": "Chatbot not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    original_filename = secure_filename(file.filename)

    if not original_filename.lower().endswith(".pdf"):
        return jsonify({
            "error": "Only PDF files are allowed"
        }), 400

    temp_path = None
    object_path = None
    uploaded_to_storage = False

    try:

        # Save temporarily for PDF text extraction
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False
        ) as temp_file:

            temp_path = temp_file.name

        file.save(temp_path)

        # Extract and process PDF content
        result = KnowledgeService.process_document(temp_path)

        if result["status"] != "processed":
            return jsonify({
                "error": (
                    "No readable text found in this PDF. "
                    "Scanned PDFs need OCR."
                )
            }), 422

        # Create a unique storage path
        unique_filename = (
            f"{uuid.uuid4().hex}_{original_filename}"
        )

        object_path = (
            f"chatbots/{chatbot.id}/{unique_filename}"
        )

        # Upload original PDF to Supabase
        upload_to_storage(temp_path, object_path)
        uploaded_to_storage = True

        # Save document details in database
        document = KnowledgeDocument(
            filename=original_filename,
            file_path=object_path,
            extracted_text=result["extracted_text"],
            processing_status="processed",
            chatbot_id=chatbot.id
        )

        db.session.add(document)
        db.session.flush()

        # Save knowledge chunks
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

        # Remove uploaded file if database saving fails
        if uploaded_to_storage and object_path:

            try:
                delete_from_storage(object_path)
            except Exception:
                current_app.logger.exception(
                    "Could not clean up uploaded PDF from Supabase."
                )

        current_app.logger.exception("Document upload failed.")

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        # Remove temporary local PDF
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@documents_bp.route(
    "/chatbots/<int:chatbot_id>",
    methods=["GET"]
)
@token_required
def get_documents(chatbot_id):

    chatbot = get_owned_chatbot(chatbot_id)

    if not chatbot:
        return jsonify({"error": "Chatbot not found"}), 404

    documents = KnowledgeDocument.query.filter_by(
        chatbot_id=chatbot.id
    ).order_by(
        KnowledgeDocument.uploaded_at.desc()
    ).all()

    return jsonify({
        "documents": [
            {
                "id": document.id,
                "filename": document.filename,
                "status": document.processing_status,
                "uploaded_at": document.uploaded_at.isoformat(),
                "total_chunks": len(document.chunks)
            }
            for document in documents
        ]
    }), 200


@documents_bp.route(
    "/<int:document_id>",
    methods=["DELETE"]
)
@token_required
def delete_document(document_id):

    document = (
        KnowledgeDocument.query
        .join(Chatbot)
        .join(Business)
        .filter(
            KnowledgeDocument.id == document_id,
            Business.owner_id == g.current_user.id
        )
        .first()
    )

    if not document:
        return jsonify({"error": "Document not found"}), 404

    object_path = document.file_path

    try:

        # Delete PDF from Supabase first
        if object_path:
            delete_from_storage(object_path)

        # Delete document and related chunks from database
        db.session.delete(document)
        db.session.commit()

        return jsonify({
            "message": "Document deleted successfully"
        }), 200

    except Exception as error:

        db.session.rollback()

        current_app.logger.exception("Document deletion failed.")

        return jsonify({
            "error": str(error)
        }), 500