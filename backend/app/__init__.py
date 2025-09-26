"""Flask application factory."""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from .config import Config

# Initialize database
db = SQLAlchemy()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config())

    # Initialize CORS
    CORS(app)

    # Initialize database
    db.init_app(app)

    # Import models to register them with SQLAlchemy
    from .models import college  # noqa: F401

    # Register blueprints
    from .routes import colleges
    app.register_blueprint(colleges.colleges_bp, url_prefix="/api/colleges")

    return app
