from flask import Flask
from flask_cors import CORS
import os

def create_app():
    """Application Factory"""
    app = Flask(__name__)

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SSIS-ccc181-0040", "dev"),
        API_PREFIX=os.environ.get("API_PREFIX", "/api"),
    )

    CORS(app)

    # Example test route
    @app.route("/")
    def index():
        return {"message": "Flask backend is running!"}

    return app
