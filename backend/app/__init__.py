"""Flask application factory."""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import secrets

from .config import Config

# Initialize database
db = SQLAlchemy()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    config = Config()
    app.config.from_object(config)
    
    # Handle SECRET_KEY properly
    secret_key = app.config.get('SECRET_KEY')
    
    # Check if SECRET_KEY is None, empty, or the default insecure value
    if not secret_key or secret_key in ['dev', 'dev-secret-key-change-in-production', '1234']:
        # Generate a secure random key
        secure_key = secrets.token_hex(32)
        app.config['SECRET_KEY'] = secure_key
        
        # Log appropriate warning
        if not secret_key:
            app.logger.warning("⚠️  SECRET_KEY not set in environment!")
        else:
            app.logger.warning(f"⚠️  INSECURE SECRET_KEY detected: '{secret_key}'")
            
        app.logger.warning(f"⚠️  Generated secure key: {secure_key[:16]}...")
        app.logger.warning("⚠️  For production, set SECRET_KEY environment variable!")
    else:
        # SECRET_KEY is properly set
        app.logger.info(f"SECRET_KEY is set (first 8 chars): {secret_key[:8]}...")
    
    # Log database info
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', 'Not set')
    # Mask password in logs for security
    if '@' in db_uri and ':' in db_uri.split('@')[0]:
        # Hide password in logs
        user_pass, rest = db_uri.split('@', 1)
        if ':' in user_pass:
            user, _ = user_pass.split(':', 1)
            safe_uri = f"{user}:****@{rest}"
            app.logger.info(f"Database: {safe_uri}")
    
    # Initialize CORS
    CORS(
        app,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Initialize database
    db.init_app(app)

    # Import models
    from .models import college  # noqa: F401

    # Register blueprints
    from .routes import colleges
    app.register_blueprint(colleges.colleges_bp, url_prefix="/api/colleges")

    from .routes import programs
    app.register_blueprint(programs.programs_bp, url_prefix="/api/programs")

    from .routes import students
    app.register_blueprint(students.students_bp, url_prefix="/api/students")

    # Register auth blueprint
    from .routes import auth
    app.register_blueprint(auth.auth_bp, url_prefix="/api/auth")

    return app