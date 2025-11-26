from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import secrets

from .config import Config

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    
    config = Config()
    app.config.from_object(config)
    
    secret_key = app.config.get('SECRET_KEY')
    
    if not secret_key or secret_key in ['dev', 'dev-secret-key-change-in-production', '1234']:
        secure_key = secrets.token_hex(32)
        app.config['SECRET_KEY'] = secure_key
        
        if not secret_key:
            app.logger.warning("⚠️  SECRET_KEY not set in environment!")
        else:
            app.logger.warning(f"⚠️  INSECURE SECRET_KEY detected: '{secret_key}'")
            
        app.logger.warning(f"⚠️  Generated secure key: {secure_key[:16]}...")
        app.logger.warning("⚠️  For production, set SECRET_KEY environment variable!")
    else:
        app.logger.info(f"SECRET_KEY is set (first 8 chars): {secret_key[:8]}...")
    
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', 'Not set')
    if '@' in db_uri and ':' in db_uri.split('@')[0]:
        user_pass, rest = db_uri.split('@', 1)
        if ':' in user_pass:
            user, _ = user_pass.split(':', 1)
            safe_uri = f"{user}:****@{rest}"
            app.logger.info(f"Database: {safe_uri}")
    
    CORS(
        app,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    db.init_app(app)

    from .models import college  # noqa: F401

    from .routes import colleges
    app.register_blueprint(colleges.colleges_bp, url_prefix="/api/colleges")

    from .routes import programs
    app.register_blueprint(programs.programs_bp, url_prefix="/api/programs")

    from .routes import students
    app.register_blueprint(students.students_bp, url_prefix="/api/students")

    from .routes import auth
    app.register_blueprint(auth.auth_bp, url_prefix="/api/auth")

    return app