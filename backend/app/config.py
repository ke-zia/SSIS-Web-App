"""Configuration for the Flask application."""

import os


class Config:
    """Base configuration for the Flask application."""
    
    # Use environment variable - if not set, Flask will use default or we'll set it in __init__
    SECRET_KEY = os.getenv("SECRET_KEY", None)  # Let __init__.py handle the fallback
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"postgresql+psycopg2://{os.getenv('POSTGRES_USER', 'postgres')}:"
        f"{os.getenv('POSTGRES_PASSWORD', 'password')}@"
        f"{os.getenv('POSTGRES_HOST', 'localhost')}:"
        f"{os.getenv('POSTGRES_PORT', '5432')}/"
        f"{os.getenv('POSTGRES_DB', 'ssis_db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False