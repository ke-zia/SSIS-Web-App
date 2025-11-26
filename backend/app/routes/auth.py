"""Authentication routes."""
from http import HTTPStatus
import jwt
import datetime
from flask import Blueprint, jsonify, request, current_app
from werkzeug.security import check_password_hash

from ..services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    """POST /api/auth/login - authenticate a user.

    Expects JSON: { "email": "...", "password": "..." }
    Returns 200 with JWT token containing user info on success, 401 on failure.
    """
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    current_app.logger.info(f"Login attempt for email: {email}")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), HTTPStatus.BAD_REQUEST

    try:
        user = AuthService.get_by_email(email)
    except Exception as e:
        current_app.logger.error(f"Error loading user during login: {e}")
        return jsonify({"message": "Server error"}), HTTPStatus.INTERNAL_SERVER_ERROR

    if not user:
        current_app.logger.warning(f"Failed login attempt for email: {email}")
        return jsonify({"message": "Invalid email or password"}), HTTPStatus.UNAUTHORIZED

    user_id = user["id"]
    user_email = user["email"]
    password_hash = user["password_hash"]

    if not check_password_hash(password_hash, password):
        current_app.logger.warning(f"Invalid password for email: {email}")
        return jsonify({"message": "Invalid email or password"}), HTTPStatus.UNAUTHORIZED

    secret = current_app.config.get("SECRET_KEY")
    if not secret:
        current_app.logger.error("SECRET_KEY is not configured")
        return jsonify({"message": "Server configuration error"}), HTTPStatus.INTERNAL_SERVER_ERROR

    try:
        token = jwt.encode(
            {
                "user_id": user_id,
                "email": user_email,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            },
            secret,
            algorithm="HS256",
        )
        if isinstance(token, bytes):
            token = token.decode("utf-8")
    except Exception as e:
        current_app.logger.error(f"JWT encoding error: {e}")
        return jsonify({"message": "Authentication error"}), HTTPStatus.INTERNAL_SERVER_ERROR

    current_app.logger.info(f"Successful login for user_id: {user_id}")

    response_data = {
        "token": token,
        "user": {"id": str(user_id), "email": user_email},
    }

    return jsonify(response_data), HTTPStatus.OK


@auth_bp.get("/me")
def get_current_user():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"message": "Missing or invalid token"}), HTTPStatus.UNAUTHORIZED

    token = auth_header.split(" ", 1)[1]

    secret = current_app.config.get("SECRET_KEY")
    if not secret:
        current_app.logger.error("SECRET_KEY is not configured")
        return jsonify({"message": "Server configuration error"}), HTTPStatus.INTERNAL_SERVER_ERROR

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return jsonify({"id": payload["user_id"], "email": payload["email"]}), HTTPStatus.OK
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("Expired token used")
        return jsonify({"message": "Token has expired"}), HTTPStatus.UNAUTHORIZED
    except jwt.InvalidTokenError as e:
        current_app.logger.warning(f"Invalid token: {e}")
        return jsonify({"message": "Invalid token"}), HTTPStatus.UNAUTHORIZED
    except Exception as e:
        current_app.logger.error(f"Token decoding error: {e}")
        return jsonify({"message": "Authentication error"}), HTTPStatus.INTERNAL_SERVER_ERROR