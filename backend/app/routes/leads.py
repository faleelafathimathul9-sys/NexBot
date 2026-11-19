from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models import Lead, Chatbot, Conversation, Business
from app.routes.auth import token_required
import re


leads_bp = Blueprint(
    "leads",
    __name__,
    url_prefix="/api/leads"
)


# CUSTOMER: Submit a new lead
@leads_bp.route("/", methods=["POST"])
def create_lead():

    data = request.get_json(silent=True) or {}

    try:
        chatbot_id = int(data.get("chatbot_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Valid chatbot ID is required"}), 400

    conversation_id = data.get("conversation_id")

    customer_name = str(data.get("customer_name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    enquiry = str(data.get("enquiry", "")).strip()
    consent_given = data.get("consent_given") is True

    if not customer_name or not phone or not enquiry:
        return jsonify({
            "error": "Name, phone number and enquiry are required"
        }), 400

    if not consent_given:
        return jsonify({
            "error": "Customer consent is required"
        }), 400

    if len(customer_name) > 120 or len(enquiry) > 3000:
        return jsonify({"error": "Submitted information is too long"}), 400

    if not re.fullmatch(r"^\+?[0-9\s\-()]{7,20}$", phone):
        return jsonify({"error": "Enter a valid phone number"}), 400

    if email and (
        len(email) > 150
        or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)
    ):
        return jsonify({"error": "Enter a valid email address"}), 400

    chatbot = db.session.get(Chatbot, chatbot_id)

    if not chatbot or not chatbot.is_active:
        return jsonify({"error": "Assistant is unavailable"}), 404

    conversation = None

    if conversation_id is not None:
        try:
            conversation_id = int(conversation_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid conversation"}), 400

        conversation = db.session.get(Conversation, conversation_id)

        if not conversation or conversation.chatbot_id != chatbot.id:
            return jsonify({"error": "Invalid conversation"}), 400

    new_lead = Lead(
        customer_name=customer_name,
        phone=phone,
        email=email or None,
        enquiry=enquiry,
        consent_given=True,
        status="New",
        business_id=chatbot.business_id,
        chatbot_id=chatbot.id,
        conversation_id=conversation.id if conversation else None
    )

    try:
        db.session.add(new_lead)
        db.session.commit()

        return jsonify({
            "message": "Your enquiry has been submitted successfully",
            "lead_id": new_lead.id
        }), 201

    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Could not save your enquiry"
        }), 500


# BUSINESS OWNER: View their leads
@leads_bp.route("/", methods=["GET"])
@token_required
def get_leads():

    leads = (
        Lead.query
        .join(Lead.business)
        .filter(Business.owner_id == g.current_user.id)
        .order_by(Lead.created_at.desc())
        .all()
    )

    results = []

    for lead in leads:
        results.append({
            "id": lead.id,
            "customer_name": lead.customer_name,
            "phone": lead.phone,
            "email": lead.email,
            "enquiry": lead.enquiry,
            "status": lead.status,
            "chatbot_name": lead.chatbot.name,
            "business_name": lead.business.name,
            "conversation_id": lead.conversation_id,
            "created_at": lead.created_at.isoformat()
        })

    return jsonify({
        "leads": results,
        "total": len(results)
    }), 200


# BUSINESS OWNER: Update lead status
@leads_bp.route("/<int:lead_id>", methods=["PATCH"])
@token_required
def update_lead(lead_id):

    lead = (
        Lead.query
        .join(Lead.business)
        .filter(
            Lead.id == lead_id,
            Business.owner_id == g.current_user.id
        )
        .first()
    )

    if not lead:
        return jsonify({"error": "Lead not found"}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    allowed_statuses = ["New", "Contacted", "Converted"]

    if new_status not in allowed_statuses:
        return jsonify({
            "error": "Status must be New, Contacted or Converted"
        }), 400

    lead.status = new_status

    try:
        db.session.commit()

        return jsonify({
            "message": "Lead status updated successfully",
            "lead_id": lead.id,
            "status": lead.status
        }), 200

    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Could not update lead"
        }), 500