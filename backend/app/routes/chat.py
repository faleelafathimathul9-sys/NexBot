import uuid
import re

from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models import Chatbot, Conversation, Message
from app.services.retrieval_service import RetrievalService
from app.services.ai_service import AIService


chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


def detect_language(text, preferred_language="en"):
    """
    Detect Kannada using its Unicode script.
    Otherwise, use English.
    """

    if re.search(r"[\u0C80-\u0CFF]", text):
        return "kn"

    return "en"


@chat_bp.route("/<int:chatbot_id>", methods=["POST"])
def send_message(chatbot_id):

    data = request.get_json(silent=True) or {}

    question = str(data.get("message", "")).strip()
    session_id = data.get("session_id") or str(uuid.uuid4())

    preferred_language = data.get("language", "en")

    if preferred_language not in ["en", "kn"]:
        preferred_language = "en"

    if not question:
        return jsonify({"error": "Message cannot be empty"}), 400

    chatbot = db.session.get(Chatbot, chatbot_id)

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

        # Detect the language of the latest customer message.
        detected_language = detect_language(
            question,
            preferred_language
        )

        # Retrieve recent messages to preserve conversation context.
        previous_messages = (
            Message.query
            .filter_by(conversation_id=conversation.id)
            .order_by(Message.created_at.desc())
            .limit(12)
            .all()
        )

        previous_messages.reverse()

        conversation_history = [
            {
                "role": message.role,
                "content": message.content
            }
            for message in previous_messages
        ]

        # Retrieve relevant business knowledge.
        results = RetrievalService.retrieve_relevant_chunks(
            chatbot_id=chatbot.id,
            question=question
        )

        context = RetrievalService.build_context(results)

        # Generate an answer in the detected language.
        answer = AIService.generate_answer(
            question=question,
            context=context,
            business_name=chatbot.business.name,
            language=detected_language,
            conversation_history=conversation_history
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
            "conversation_id": conversation.id,
            "question": question,
            "answer": answer,
            "language": detected_language,
            "sources_used": len(results)
        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({
            "error": str(error)
        }), 500