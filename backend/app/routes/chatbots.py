import re

from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models import Chatbot, Business
from app.routes.auth import token_required


chatbot_bp = Blueprint(
    "chatbots",
    __name__,
    url_prefix="/api/chatbots"
)


def chatbot_to_dict(chatbot):
    return {
        "id": chatbot.id,
        "name": chatbot.name,
        "description": chatbot.description,
        "welcome_message": chatbot.welcome_message,
        "is_active": chatbot.is_active,
        "theme_color": chatbot.theme_color or "#173D32",
        "business_id": chatbot.business_id,
        "created_at": chatbot.created_at.isoformat()
    }


def valid_theme_color(color):
    return bool(
        isinstance(color, str)
        and re.fullmatch(r"#[0-9A-Fa-f]{6}", color)
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


# CREATE CHATBOT
@chatbot_bp.route("/", methods=["POST"])
@token_required
def create_chatbot():

    data = request.get_json(silent=True) or {}

    name = str(data.get("name") or "").strip()
    business_id = data.get("business_id")
    description = str(data.get("description") or "").strip()

    welcome_message = str(
        data.get(
            "welcome_message",
            "Hello! How can I help you today?"
        ) or ""
    ).strip()

    theme_color = data.get("theme_color", "#173D32")

    if not name or not business_id:
        return jsonify({
            "error": "Chatbot name and business ID are required"
        }), 400

    if not valid_theme_color(theme_color):
        return jsonify({
            "error": "Please provide a valid hex colour."
        }), 400

    business = Business.query.filter_by(
        id=business_id,
        owner_id=g.current_user.id
    ).first()

    if not business:
        return jsonify({
            "error": "Business not found"
        }), 404

    chatbot = Chatbot(
        name=name,
        description=description,
        welcome_message=welcome_message,
        theme_color=theme_color,
        business_id=business.id
    )

    db.session.add(chatbot)
    db.session.commit()

    return jsonify({
        "message": "Chatbot created successfully",
        "chatbot": chatbot_to_dict(chatbot)
    }), 201


# GET ALL CHATBOTS
@chatbot_bp.route("/", methods=["GET"])
@token_required
def get_chatbots():

    chatbots = (
        Chatbot.query
        .join(Business)
        .filter(Business.owner_id == g.current_user.id)
        .all()
    )

    return jsonify({
        "chatbots": [
            chatbot_to_dict(chatbot)
            for chatbot in chatbots
        ]
    }), 200


# PUBLIC CHATBOT DETAILS
@chatbot_bp.route("/public/<int:chatbot_id>", methods=["GET"])
def get_public_chatbot(chatbot_id):

    chatbot = (
        Chatbot.query
        .join(Business)
        .filter(Chatbot.id == chatbot_id)
        .first()
    )

    if not chatbot or not chatbot.is_active:
        return jsonify({
            "error": "This chatbot is unavailable"
        }), 404

    return jsonify({
        "chatbot": {
            "id": chatbot.id,
            "name": chatbot.name,
            "description": chatbot.description,
            "welcome_message": chatbot.welcome_message,
            "theme_color": chatbot.theme_color or "#173D32",
            "business_name": chatbot.business.name
        }
    }), 200


# GET ONE CHATBOT
@chatbot_bp.route("/<int:chatbot_id>", methods=["GET"])
@token_required
def get_chatbot(chatbot_id):

    chatbot = get_owned_chatbot(chatbot_id)

    if not chatbot:
        return jsonify({
            "error": "Chatbot not found"
        }), 404

    return jsonify({
        "chatbot": chatbot_to_dict(chatbot)
    }), 200


# UPDATE CHATBOT
@chatbot_bp.route("/<int:chatbot_id>", methods=["PUT"])
@token_required
def update_chatbot(chatbot_id):

    chatbot = get_owned_chatbot(chatbot_id)

    if not chatbot:
        return jsonify({
            "error": "Chatbot not found"
        }), 404

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = str(data["name"] or "").strip()

        if not name:
            return jsonify({
                "error": "Chatbot name cannot be empty"
            }), 400

        chatbot.name = name

    if "description" in data:
        chatbot.description = str(data["description"] or "").strip()

    if "welcome_message" in data:
        chatbot.welcome_message = str(
            data["welcome_message"] or ""
        ).strip()

    if "is_active" in data:
        chatbot.is_active = bool(data["is_active"])

    if "theme_color" in data:
        theme_color = data["theme_color"]

        if not valid_theme_color(theme_color):
            return jsonify({
                "error": "Please provide a valid hex colour."
            }), 400

        chatbot.theme_color = theme_color

    db.session.commit()

    return jsonify({
        "message": "Chatbot updated successfully",
        "chatbot": chatbot_to_dict(chatbot)
    }), 200


# DELETE CHATBOT
@chatbot_bp.route("/<int:chatbot_id>", methods=["DELETE"])
@token_required
def delete_chatbot(chatbot_id):

    chatbot = get_owned_chatbot(chatbot_id)

    if not chatbot:
        return jsonify({
            "error": "Chatbot not found"
        }), 404

    db.session.delete(chatbot)
    db.session.commit()

    return jsonify({
        "message": "Chatbot deleted successfully"
    }), 200