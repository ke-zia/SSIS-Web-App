"""Main application entry point."""

import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded environment from: {env_path}")
else:
    print("No .env file found. Using default/OS environment variables.")

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)