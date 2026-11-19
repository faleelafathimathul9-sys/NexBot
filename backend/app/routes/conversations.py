from flask import Blueprint, jsonify, g

from app.models import Business, Chatbot, Conversation
from app.routes.auth import token_required


conversations_bp = Blueprint(
    "conversations",
    __name__,
    url_prefix="/api/conversations"
)


# Get all conversations belonging to the logged-in owner

@conversations_bp.route("/", methods=["GET"])
@token_required
def get_conversations():

    conversations = (
        Conversation.query
        .join(Chatbot)
        .join(Business)
        .filter(Business.owner_id == g.current_user.id)
        .order_by(Conversation.started_at.desc())
        .limit(100)
        .all()
    )

    result = []

    for conversation in conversations:

        result.append({
            "id": conversation.id,
            "chatbot_id": conversation.chatbot_id,
            "chatbot_name": conversation.chatbot.name,
            "visitor_name": conversation.visitor_name or "Guest",
            "started_at": (
                conversation.started_at.isoformat()
                if conversation.started_at else None
            ),
            "message_count": len(conversation.messages)
        })

    return jsonify({
        "conversations": result
    }), 200


# Get the messages in one conversation

@conversations_bp.route("/<int:conversation_id>", methods=["GET"])
@token_required
def get_conversation_details(conversation_id):

    conversation = (
        Conversation.query
        .join(Chatbot)
        .join(Business)
        .filter(
            Conversation.id == conversation_id,
            Business.owner_id == g.current_user.id
        )
        .first()
    )

    if not conversation:
        return jsonify({
            "error": "Conversation not found"
        }), 404

    messages = [
        {
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "created_at": (
                message.created_at.isoformat()
                if message.created_at else None
            )
        }
        for message in conversation.messages
    ]

    return jsonify({
        "conversation": {
            "id": conversation.id,
            "chatbot_name": conversation.chatbot.name,
            "visitor_name": conversation.visitor_name or "Guest",
            "started_at": (
                conversation.started_at.isoformat()
                if conversation.started_at else None
            ),
            "messages": messages
        }
    }), 200