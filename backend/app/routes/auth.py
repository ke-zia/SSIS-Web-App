"""Authentication routes."""
from http import HTTPStatus
import jwt
import datetime
from flask import Blueprint, jsonify, request, current_app
from werkzeug.security import check_password_hash
from sqlalchemy import text

from .. import db

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

    # Query users table for the email
    try:
        stmt = text("SELECT id, email, password_hash FROM users WHERE email = :email")
        row = db.session.execute(stmt, {"email": email}).fetchone()
    except Exception as e:
        current_app.logger.error(f"Database error during login: {e}")
        return jsonify({"message": "Database error"}), HTTPStatus.INTERNAL_SERVER_ERROR

    if not row:
        # Log failed login attempt (without password for security)
        current_app.logger.warning(f"Failed login attempt for email: {email}")
        return jsonify({"message": "Invalid email or password"}), HTTPStatus.UNAUTHORIZED

    user_id, user_email, password_hash = row

    if not check_password_hash(password_hash, password):
        # Log failed password attempt
        current_app.logger.warning(f"Invalid password for email: {email}")
        return jsonify({"message": "Invalid email or password"}), HTTPStatus.UNAUTHORIZED

    # Create JWT token
    try:
        token = jwt.encode(
            {
                'user_id': user_id,
                'email': user_email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            },
            current_app.config.get('SECRET_KEY', 'your-secret-key-here'),
            algorithm='HS256'
        )
    except Exception as e:
        current_app.logger.error(f"JWT encoding error: {e}")
        return jsonify({"message": "Authentication error"}), HTTPStatus.INTERNAL_SERVER_ERROR

    # Log successful login
    current_app.logger.info(f"Successful login for email: {email}")
    
    response_data = {
        "token": token,
        "user": {
            "id": str(user_id),
            "email": user_email
        }
    }
    
    current_app.logger.info(f"Returning response: {response_data}")
    
    # Authentication successful
    return jsonify(response_data), HTTPStatus.OK


@auth_bp.get("/me")
def get_current_user():
    """GET /api/auth/me - get current user info from JWT token."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Missing or invalid token"}), HTTPStatus.UNAUTHORIZED
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(
            token,
            current_app.config.get('SECRET_KEY', 'your-secret-key-here'),
            algorithms=['HS256']
        )
        
        return jsonify({
            "id": payload['user_id'],
            "email": payload['email']
        }), HTTPStatus.OK
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("Expired token used")
        return jsonify({"message": "Token has expired"}), HTTPStatus.UNAUTHORIZED
    except jwt.InvalidTokenError as e:
        current_app.logger.warning(f"Invalid token: {e}")
        return jsonify({"message": "Invalid token"}), HTTPStatus.UNAUTHORIZED
    except Exception as e:
        current_app.logger.error(f"Token decoding error: {e}")
        return jsonify({"message": "Authentication error"}), HTTPStatus.INTERNAL_SERVER_ERROR