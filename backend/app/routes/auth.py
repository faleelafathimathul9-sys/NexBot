from flask import Blueprint, request, jsonify, current_app, g
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime, timedelta, timezone
import jwt

from app.extensions import db
from app.models import User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# Generate JWT authentication token
def generate_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }

    token = jwt.encode(
        payload,
        current_app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return token


# Verify authentication token
def token_required(function):
    @wraps(function)
    def decorated(*args, **kwargs):

        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Authentication token is required"}), 401

        if token.startswith("Bearer "):
            token = token.split(" ", 1)[1]

        try:
            data = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=["HS256"]
            )

            current_user = db.session.get(User, data["user_id"])

            if not current_user:
                return jsonify({"error": "User not found"}), 401

            g.current_user = current_user

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401

        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401

        return function(*args, **kwargs)

    return decorated


# User registration
@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must contain at least 8 characters"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "error": "An account with this email already exists"
        }), 409

    new_user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )

    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user.id)

    return jsonify({
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }), 201


# User login
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(
        user.password_hash, password
    ):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    token = generate_token(user.id)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200


# Get logged-in user profile
@auth_bp.route("/me", methods=["GET"])
@token_required
def get_profile():

    user = g.current_user

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email
    }), 200