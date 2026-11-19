from flask import Blueprint, jsonify, g
from sqlalchemy import func

from app.extensions import db
from app.models import (
    Business,
    Chatbot,
    Conversation,
    Message
)
from app.routes.auth import token_required


analytics_bp = Blueprint(
    "analytics",
    __name__,
    url_prefix="/api/analytics"
)


@analytics_bp.route("/", methods=["GET"])
@token_required
def get_analytics():

    # Get all chatbots belonging to the logged-in user

    chatbots = (
        Chatbot.query
        .join(Business)
        .filter(Business.owner_id == g.current_user.id)
        .all()
    )

    chatbot_ids = [bot.id for bot in chatbots]

    if not chatbot_ids:
        return jsonify({
            "total_chatbots": 0,
            "active_chatbots": 0,
            "total_conversations": 0,
            "total_messages": 0,
            "top_questions": [],
            "chatbot_usage": []
        }), 200

    # Total conversations

    total_conversations = (
        db.session.query(func.count(Conversation.id))
        .filter(Conversation.chatbot_id.in_(chatbot_ids))
        .scalar()
    )

    # Total customer messages

    total_messages = (
        db.session.query(func.count(Message.id))
        .join(Conversation)
        .filter(
            Conversation.chatbot_id.in_(chatbot_ids),
            Message.role == "user"
        )
        .scalar()
    )

    # Active chatbots

    active_chatbots = sum(
        1 for bot in chatbots if bot.is_active
    )

    # Individual chatbot usage

    chatbot_usage = []

    for bot in chatbots:

        conversations = Conversation.query.filter_by(
            chatbot_id=bot.id
        ).count()

        messages = (
            db.session.query(func.count(Message.id))
            .join(Conversation)
            .filter(
                Conversation.chatbot_id == bot.id,
                Message.role == "user"
            )
            .scalar()
        )

        chatbot_usage.append({
            "chatbot_id": bot.id,
            "chatbot_name": bot.name,
            "conversations": conversations,
            "messages": messages,
            "status": "Active" if bot.is_active else "Inactive"
        })

    # Most frequently asked questions

    user_messages = (
        Message.query
        .join(Conversation)
        .filter(
            Conversation.chatbot_id.in_(chatbot_ids),
            Message.role == "user"
        )
        .all()
    )

    question_counts = {}

    for message in user_messages:

        question = " ".join(message.content.strip().lower().split())

        if question:
            question_counts[question] = (
                question_counts.get(question, 0) + 1
            )

    top_questions = sorted(
        question_counts.items(),
        key=lambda item: item[1],
        reverse=True
    )[:5]

    formatted_questions = [
        {
            "question": question,
            "count": count
        }
        for question, count in top_questions
    ]

    return jsonify({

        "total_chatbots": len(chatbots),

        "active_chatbots": active_chatbots,

        "total_conversations": total_conversations or 0,

        "total_messages": total_messages or 0,

        "top_questions": formatted_questions,

        "chatbot_usage": chatbot_usage

    }), 200