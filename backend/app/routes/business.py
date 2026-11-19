from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models import Business
from app.routes.auth import token_required

business_bp = Blueprint(
    "business",
    __name__,
    url_prefix="/api/business"
)


def business_to_dict(business):
    return {
        "id": business.id,
        "name": business.name,
        "industry": business.industry,
        "description": business.description,
        "created_at": business.created_at.isoformat()
    }


# Create a new business
@business_bp.route("/", methods=["POST"])
@token_required
def create_business():

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    industry = data.get("industry", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({
            "error": "Business name is required"
        }), 400

    business = Business(
        name=name,
        industry=industry,
        description=description,
        owner_id=g.current_user.id
    )

    db.session.add(business)
    db.session.commit()

    return jsonify({
        "message": "Business created successfully",
        "business": business_to_dict(business)
    }), 201


# Get all businesses belonging to logged-in user
@business_bp.route("/", methods=["GET"])
@token_required
def get_businesses():

    businesses = Business.query.filter_by(
        owner_id=g.current_user.id
    ).all()

    return jsonify({
        "businesses": [
            business_to_dict(business)
            for business in businesses
        ]
    }), 200


# Get one business
@business_bp.route("/<int:business_id>", methods=["GET"])
@token_required
def get_business(business_id):

    business = Business.query.filter_by(
        id=business_id,
        owner_id=g.current_user.id
    ).first()

    if not business:
        return jsonify({
            "error": "Business not found"
        }), 404

    return jsonify({
        "business": business_to_dict(business)
    }), 200


# Update business details
@business_bp.route("/<int:business_id>", methods=["PUT"])
@token_required
def update_business(business_id):

    business = Business.query.filter_by(
        id=business_id,
        owner_id=g.current_user.id
    ).first()

    if not business:
        return jsonify({
            "error": "Business not found"
        }), 404

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "Business name cannot be empty"}), 400
        business.name = name

    if "industry" in data:
        business.industry = data["industry"].strip()

    if "description" in data:
        business.description = data["description"].strip()

    db.session.commit()

    return jsonify({
        "message": "Business updated successfully",
        "business": business_to_dict(business)
    }), 200


# Delete business
@business_bp.route("/<int:business_id>", methods=["DELETE"])
@token_required
def delete_business(business_id):

    business = Business.query.filter_by(
        id=business_id,
        owner_id=g.current_user.id
    ).first()

    if not business:
        return jsonify({
            "error": "Business not found"
        }), 404

    db.session.delete(business)
    db.session.commit()

    return jsonify({
        "message": "Business deleted successfully"
    }), 200