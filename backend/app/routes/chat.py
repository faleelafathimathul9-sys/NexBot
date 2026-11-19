import uuid

from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models import Chatbot, Conversation, Message
from app.services.retrieval_service import RetrievalService
from app.services.ai_service import AIService


chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@chat_bp.route("/<int:chatbot_id>", methods=["POST"])
def send_message(chatbot_id):

    data = request.get_json(silent=True) or {}

    question = data.get("message", "").strip()
    session_id = data.get("session_id") or str(uuid.uuid4())

    if not question:
        return jsonify({"error": "Message cannot be empty"}), 400

    chatbot = Chatbot.query.get(chatbot_id)

    if not chatbot or not chatbot.is_active:
        return jsonify({"error": "Chatbot not found or inactive"}), 404

    conversation = Conversation.query.filter_by(
        session_id=session_id
    ).first()

    if conversation and conversation.chatbot_id != chatbot.id:
        return jsonify({"error": "Invalid conversation session"}), 409

    if not conversation:
        conversation = Conversation(
            session_id=session_id,
            chatbot_id=chatbot.id
        )
        db.session.add(conversation)
        db.session.flush()

    try:
        results = RetrievalService.retrieve_relevant_chunks(
            chatbot_id=chatbot.id,
            question=question
        )

        context = RetrievalService.build_context(results)

        answer = AIService.generate_answer(
            question=question,
            context=context,
            business_name=chatbot.business.name
        )

        user_message = Message(
            role="user",
            content=question,
            conversation_id=conversation.id
        )

        assistant_message = Message(
            role="assistant",
            content=answer,
            conversation_id=conversation.id
        )

        db.session.add(user_message)
        db.session.add(assistant_message)
        db.session.commit()

        return jsonify({
            "session_id": session_id,
            "question": question,
            "answer": answer,
            "sources_used": len(results)
        }), 200

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "error": str(error)
        }), 500